import { Router } from "express";
import type { Db } from "@nexioai/db";
import { issueService, logActivity } from "../services/index.js";
import { logger } from "../middleware/logger.js";

/**
 * Google Chat webhook integration.
 *
 * When configured, a Google Chat Bot/App sends events here when the bot is
 * @mentioned in a space. If the message contains a PR URL, an issue is
 * auto-created for review.
 *
 * Setup:
 *   1. Create a Google Chat App at https://console.cloud.google.com
 *   2. Set the HTTP endpoint to: <your-server>/api/integrations/google-chat/webhook
 *   3. Set NEXIO_GOOGLE_CHAT_VERIFICATION_TOKEN to the token from Google
 *   4. Set NEXIO_GOOGLE_CHAT_COMPANY_ID to the company that should receive issues
 *   5. Optionally set NEXIO_GOOGLE_CHAT_PROJECT_ID to assign issues to a project
 */

const PR_URL_PATTERN = /https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
const GITLAB_MR_PATTERN = /https?:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+\/-\/merge_requests\/\d+/g;
const BITBUCKET_PR_PATTERN = /https?:\/\/bitbucket\.org\/[\w.-]+\/[\w.-]+\/pull-requests\/\d+/g;

function extractPrUrls(text: string): string[] {
  const urls = new Set<string>();
  for (const m of text.matchAll(PR_URL_PATTERN)) urls.add(m[0]);
  for (const m of text.matchAll(GITLAB_MR_PATTERN)) urls.add(m[0]);
  for (const m of text.matchAll(BITBUCKET_PR_PATTERN)) urls.add(m[0]);
  return [...urls];
}

interface GoogleChatEvent {
  type: string;
  eventTime?: string;
  token?: { verificationToken?: string };
  message?: {
    name?: string;
    text?: string;
    argumentText?: string;
    sender?: {
      name?: string;
      displayName?: string;
      email?: string;
      type?: string;
    };
    space?: {
      name?: string;
      displayName?: string;
      type?: string;
    };
    thread?: {
      name?: string;
    };
  };
  space?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
  action?: {
    actionMethodName?: string;
  };
}

export function googleChatRoutes(db: Db) {
  const router = Router();
  const issues = issueService(db);

  const verificationToken = process.env.NEXIO_GOOGLE_CHAT_VERIFICATION_TOKEN?.trim() || null;
  const targetCompanyId = process.env.NEXIO_GOOGLE_CHAT_COMPANY_ID?.trim() || null;
  const targetProjectId = process.env.NEXIO_GOOGLE_CHAT_PROJECT_ID?.trim() || null;
  const allowedSpaces = process.env.NEXIO_GOOGLE_CHAT_SPACE_NAMES?.trim()
    ? process.env.NEXIO_GOOGLE_CHAT_SPACE_NAMES.split(",").map((s) => s.trim())
    : null; // null = allow all spaces

  router.post("/integrations/google-chat/webhook", async (req, res) => {
    const event = req.body as GoogleChatEvent;

    // Verify token if configured
    if (verificationToken && event.token?.verificationToken !== verificationToken) {
      logger.warn("Google Chat webhook: invalid verification token");
      res.status(403).json({ error: "Invalid verification token" });
      return;
    }

    // Handle ADDED_TO_SPACE event
    if (event.type === "ADDED_TO_SPACE") {
      const spaceName = event.space?.displayName ?? "this space";
      res.json({
        text: `Nexio is now listening in ${spaceName}. Mention me with a PR link and I'll create a review task.`,
      });
      return;
    }

    // Only process MESSAGE events
    if (event.type !== "MESSAGE") {
      res.json({});
      return;
    }

    const message = event.message;
    if (!message?.text) {
      res.json({});
      return;
    }

    // Filter by space if configured
    const spaceName = message.space?.name ?? event.space?.name;
    if (allowedSpaces && spaceName && !allowedSpaces.some((s) => spaceName.includes(s))) {
      res.json({});
      return;
    }

    if (!targetCompanyId) {
      logger.warn("Google Chat webhook: NEXIO_GOOGLE_CHAT_COMPANY_ID not set, ignoring message");
      res.json({ text: "Integration not configured. Set NEXIO_GOOGLE_CHAT_COMPANY_ID." });
      return;
    }

    // Use argumentText (text after @mention) or full text
    const messageText = message.argumentText?.trim() || message.text;
    const prUrls = extractPrUrls(messageText);

    if (prUrls.length === 0) {
      res.json({
        text: "No PR/MR link found in your message. Send me a GitHub PR, GitLab MR, or Bitbucket PR link and I'll create a review task.",
      });
      return;
    }

    const senderName = message.sender?.displayName ?? message.sender?.email ?? "Someone";
    const spaceDisplayName = message.space?.displayName ?? "Google Chat";

    const createdIssues: string[] = [];

    for (const prUrl of prUrls) {
      try {
        const issue = await issues.create(targetCompanyId, {
          title: `PR Review: ${prUrl.split("/").pop() ? `#${prUrl.split("/").pop()}` : prUrl}`,
          description: [
            `**PR Review Request** from ${senderName} via ${spaceDisplayName}`,
            "",
            `**PR Link:** ${prUrl}`,
            "",
            `> ${messageText.slice(0, 500)}`,
            "",
            "Please review this pull request, check for correctness, code quality, and leave comments.",
          ].join("\n"),
          status: "todo",
          priority: "medium",
          ...(targetProjectId ? { projectId: targetProjectId } : {}),
        });

        createdIssues.push(issue.identifier ?? issue.id);

        await logActivity(db, {
          companyId: targetCompanyId,
          actorType: "system",
          actorId: "google-chat-integration",
          action: "issue.created",
          entityType: "issue",
          entityId: issue.id,
          details: {
            source: "google-chat",
            prUrl,
            senderName,
            spaceName: spaceDisplayName,
          },
        });

        logger.info(
          { issueId: issue.id, prUrl, sender: senderName },
          "Google Chat: created PR review issue",
        );
      } catch (err) {
        logger.error({ err, prUrl }, "Google Chat: failed to create issue for PR");
      }
    }

    if (createdIssues.length > 0) {
      const issueList = createdIssues.map((id) => `• ${id}`).join("\n");
      res.json({
        text: `Created ${createdIssues.length} review task${createdIssues.length > 1 ? "s" : ""}:\n${issueList}`,
      });
    } else {
      res.json({ text: "Failed to create review tasks. Check server logs." });
    }
  });

  return router;
}
