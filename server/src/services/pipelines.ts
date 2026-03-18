import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Db } from "@nexioai/db";
import {
  pipelineTemplates,
  pipelineRuns,
  pipelineStages,
  agents,
  issues,
  issueDocuments,
  documents,
} from "@nexioai/db";
import type { PipelineStageDefinition } from "@nexioai/shared";
import { logger } from "../middleware/logger.js";

type DefaultTemplate = {
  name: string;
  description: string;
  stages: PipelineStageDefinition[];
};

const DEFAULT_PIPELINE_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Feature Development Pipeline",
    description:
      "End-to-end feature development: plan, review, code, review, create PR, and PR review. Reviews are human-in-the-loop approval gates.",
    stages: [
      {
        key: "plan",
        label: "Plan",
        role: "engineer",
        type: "execute",
        titleTemplate: "Plan: {{input.title}}",
        descriptionTemplate:
          "Create a detailed implementation plan for:\n\n{{input.description}}\n\nInclude approach, file changes, and edge cases.",
      },
      {
        key: "plan_review",
        label: "Plan Review",
        role: "engineer",
        type: "review",
        titleTemplate: "Review Plan: {{input.title}}",
        descriptionTemplate:
          "Review the implementation plan and approve or request changes.\n\nPlan:\n{{stages.plan.output}}",
        contextFrom: "plan",
        differentAgentFrom: "plan",
      },
      {
        key: "code",
        label: "Code",
        role: "engineer",
        type: "execute",
        titleTemplate: "Implement: {{input.title}}",
        descriptionTemplate:
          "Write code based on the approved plan:\n\n{{stages.plan.output}}",
        contextFrom: "plan",
      },
      {
        key: "code_review",
        label: "Code Review",
        role: "engineer",
        type: "review",
        titleTemplate: "Code Review: {{input.title}}",
        descriptionTemplate:
          "Review the code implementation for correctness, style, and completeness.\n\nPlan:\n{{stages.plan.output}}",
        contextFrom: "code",
        differentAgentFrom: "code",
      },
      {
        key: "pr",
        label: "Create PR",
        role: "engineer",
        type: "execute",
        titleTemplate: "Create PR: {{input.title}}",
        descriptionTemplate:
          "Commit, push, and create a pull request for the approved code.\n\nPlan:\n{{stages.plan.output}}",
        contextFrom: "code",
        sameAgentAs: "code",
      },
      {
        key: "pr_review",
        label: "PR Review",
        role: "engineer",
        type: "review",
        titleTemplate: "PR Review: {{input.title}}",
        descriptionTemplate:
          "Final review of the pull request. Verify the PR is complete and ready to merge.",
        contextFrom: "pr",
        differentAgentFrom: "code",
      },
    ],
  },
  {
    name: "Simple Task Pipeline",
    description:
      "Quick implement-review-PR cycle for simple tasks. Includes automated PR comment resolution.",
    stages: [
      {
        key: "implement",
        label: "Implement",
        role: "engineer",
        type: "execute",
        titleTemplate: "Implement: {{input.title}}",
        descriptionTemplate:
          "Implement the following task:\n\n{{input.description}}",
      },
      {
        key: "review",
        label: "Review",
        role: "engineer",
        type: "review",
        titleTemplate: "Review: {{input.title}}",
        descriptionTemplate:
          "Review the implementation for correctness and completeness.\n\nTask:\n{{input.description}}\n\nImplementation:\n{{stages.implement.output}}",
        contextFrom: "implement",
        differentAgentFrom: "implement",
      },
      {
        key: "pr",
        label: "Create PR",
        role: "engineer",
        type: "execute",
        titleTemplate: "Create PR: {{input.title}}",
        descriptionTemplate:
          "Commit, push, and create a pull request for the approved implementation.",
        contextFrom: "implement",
        sameAgentAs: "implement",
      },
      {
        key: "pr_followup",
        label: "Resolve PR Comments",
        role: "engineer",
        type: "execute",
        titleTemplate: "Resolve PR Comments: {{input.title}}",
        descriptionTemplate:
          "Check the pull request for reviewer comments. For each comment:\n1. Read and understand the feedback\n2. Make the requested code changes\n3. Push the fixes\n4. Reply to the comment confirming the resolution\n\nIf there are no comments, mark this task as done.\n\nRepeat this check — if new comments appear after your fixes, resolve those too.",
        contextFrom: "pr",
        sameAgentAs: "implement",
      },
    ],
  },
];

function interpolateTemplate(
  template: string,
  input: { title: string; description: string },
  stageOutputs: Record<string, string>,
): string {
  let result = template;
  result = result.replace(/\{\{input\.title\}\}/g, input.title);
  result = result.replace(/\{\{input\.description\}\}/g, input.description);
  result = result.replace(/\{\{stages\.(\w+)\.output\}\}/g, (_match, key: string) => {
    return stageOutputs[key] ?? `[output from ${key} not available]`;
  });
  return result;
}

async function captureStageOutput(db: Db, issueId: string): Promise<Record<string, unknown>> {
  const docs = await db
    .select({
      key: issueDocuments.key,
      title: documents.title,
      body: documents.latestBody,
    })
    .from(issueDocuments)
    .innerJoin(documents, eq(issueDocuments.documentId, documents.id))
    .where(eq(issueDocuments.issueId, issueId));

  const issue = await db
    .select({ description: issues.description })
    .from(issues)
    .where(eq(issues.id, issueId))
    .then((rows) => rows[0] ?? null);

  return {
    description: issue?.description ?? null,
    documents: docs.map((d) => ({ key: d.key, title: d.title, body: d.body })),
  };
}

function flattenOutputToString(output: Record<string, unknown> | null): string {
  if (!output) return "";
  const docs = output.documents as Array<{ key: string; title: string; body: string }> | undefined;
  if (docs?.length) {
    return docs.map((d) => d.body ?? "").join("\n\n");
  }
  return (output.description as string) ?? "";
}

export function pipelineService(db: Db) {
  async function ensureDefaultTemplates(companyId: string) {
    const existing = await db
      .select({ name: pipelineTemplates.name })
      .from(pipelineTemplates)
      .where(eq(pipelineTemplates.companyId, companyId));
    const existingNames = new Set(existing.map((t) => t.name));
    const missing = DEFAULT_PIPELINE_TEMPLATES.filter((t) => !existingNames.has(t.name));
    if (missing.length === 0) return;
    await db.insert(pipelineTemplates).values(
      missing.map((t) => ({
        companyId,
        name: t.name,
        description: t.description,
        stages: t.stages,
      })),
    );
  }

  // Template CRUD
  const templateOps = {
    list: async (companyId: string) => {
      await ensureDefaultTemplates(companyId);
      return db
        .select()
        .from(pipelineTemplates)
        .where(eq(pipelineTemplates.companyId, companyId))
        .orderBy(desc(pipelineTemplates.createdAt));
    },

    getById: (id: string) =>
      db
        .select()
        .from(pipelineTemplates)
        .where(eq(pipelineTemplates.id, id))
        .then((rows) => rows[0] ?? null),

    create: (companyId: string, data: Omit<typeof pipelineTemplates.$inferInsert, "companyId">) =>
      db
        .insert(pipelineTemplates)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]),

    update: (id: string, data: Partial<typeof pipelineTemplates.$inferInsert>) =>
      db
        .update(pipelineTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pipelineTemplates.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    remove: (id: string) =>
      db
        .delete(pipelineTemplates)
        .where(eq(pipelineTemplates.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),
  };

  // Run operations
  const runOps = {
    list: (companyId: string) =>
      db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.companyId, companyId))
        .orderBy(desc(pipelineRuns.createdAt)),

    getById: async (id: string) => {
      const run = await db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.id, id))
        .then((rows) => rows[0] ?? null);
      if (!run) return null;
      const stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineRunId, id))
        .orderBy(asc(pipelineStages.stageIndex));
      return { ...run, stages };
    },

    startRun: async (
      companyId: string,
      data: {
        templateId: string;
        name: string;
        input: { title: string; description: string };
        projectId?: string | null;
        createdByUserId?: string | null;
      },
    ) => {
      const template = await templateOps.getById(data.templateId);
      if (!template) throw new Error("Pipeline template not found");
      if (template.companyId !== companyId) throw new Error("Template does not belong to this company");

      const stageSnapshot = template.stages;
      const projectId = data.projectId ?? template.projectId ?? null;

      const [run] = await db
        .insert(pipelineRuns)
        .values({
          companyId,
          templateId: data.templateId,
          name: data.name,
          status: "running",
          input: data.input,
          stageSnapshot,
          projectId,
          createdByUserId: data.createdByUserId,
        })
        .returning();

      // Create all stage rows
      const stageRows = stageSnapshot.map((stage, index) => ({
        companyId,
        pipelineRunId: run.id,
        stageKey: stage.key,
        stageIndex: index,
        role: stage.role,
        type: stage.type,
        status: "pending" as const,
      }));

      await db.insert(pipelineStages).values(stageRows);

      // Start advancing from the first stage
      void advanceRun(run.id).catch((err) =>
        logger.error({ err, runId: run.id }, "failed to advance pipeline run"),
      );

      const stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineRunId, run.id))
        .orderBy(asc(pipelineStages.stageIndex));

      return { ...run, stages };
    },

    cancelRun: async (id: string) => {
      const run = await db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.id, id))
        .then((rows) => rows[0] ?? null);
      if (!run) return null;
      if (run.status !== "running" && run.status !== "pending") return run;

      await db
        .update(pipelineRuns)
        .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(pipelineRuns.id, id));

      await db
        .update(pipelineStages)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(pipelineStages.pipelineRunId, id),
            inArray(pipelineStages.status, ["pending", "running"]),
          ),
        );

      return db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.id, id))
        .then((rows) => rows[0] ?? null);
    },
  };

  // Stage operations
  const stageOps = {
    getById: (id: string) =>
      db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.id, id))
        .then((rows) => rows[0] ?? null),

    getByIssueId: (issueId: string) =>
      db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.issueId, issueId))
        .then((rows) => rows[0] ?? null),

    reviewStage: async (stageId: string, decision: "approve" | "reject") => {
      const stage = await stageOps.getById(stageId);
      if (!stage) throw new Error("Pipeline stage not found");
      if (stage.type !== "review") throw new Error("Stage is not a review stage");
      if (stage.status !== "running") throw new Error("Stage is not running");

      if (decision === "approve") {
        await db
          .update(pipelineStages)
          .set({ status: "approved", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stageId));
        void advanceRun(stage.pipelineRunId).catch((err) =>
          logger.error({ err, runId: stage.pipelineRunId }, "failed to advance after review approval"),
        );
      } else {
        await db
          .update(pipelineStages)
          .set({ status: "rejected", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stageId));
        await failRun(stage.pipelineRunId);
      }

      return stageOps.getById(stageId);
    },
  };

  // Agent selection
  async function pickAgentForRole(
    companyId: string,
    role: string,
    excludeIds: string[] = [],
  ): Promise<string | null> {
    const conditions = [
      eq(agents.companyId, companyId),
      eq(agents.role, role),
      inArray(agents.status, ["active", "idle"]),
    ];
    if (excludeIds.length > 0) {
      conditions.push(notInArray(agents.id, excludeIds));
    }
    const agent = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(...conditions))
      .orderBy(desc(agents.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);
    return agent?.id ?? null;
  }

  // Pipeline advancement
  async function advanceRun(runId: string) {
    // Use FOR UPDATE to serialize concurrent advancement attempts
    const [run] = await db.execute<{
      id: string;
      company_id: string;
      status: string;
      input: { title: string; description: string };
      stage_snapshot: PipelineStageDefinition[];
      project_id: string | null;
    }>(sql`SELECT * FROM pipeline_runs WHERE id = ${runId} FOR UPDATE`);

    if (!run || run.status !== "running") return;

    const stages = await db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.pipelineRunId, runId))
      .orderBy(asc(pipelineStages.stageIndex));

    // Find the first stage that still needs to run
    const nextStage = stages.find((s) => s.status === "pending");
    if (!nextStage) {
      // All stages completed — mark run as completed
      const allDone = stages.every(
        (s) => s.status === "completed" || s.status === "approved" || s.status === "skipped",
      );
      if (allDone) {
        await db
          .update(pipelineRuns)
          .set({ status: "completed", completedAt: new Date(), currentStageKey: null, updatedAt: new Date() })
          .where(eq(pipelineRuns.id, runId));
      }
      return;
    }

    const stageSnapshot = run.stage_snapshot as PipelineStageDefinition[];
    const stageDef = stageSnapshot.find((s) => s.key === nextStage.stageKey);
    if (!stageDef) {
      logger.error({ runId, stageKey: nextStage.stageKey }, "stage definition not found in snapshot");
      await failRun(runId);
      return;
    }

    // Build stage outputs from completed stages
    const stageOutputs: Record<string, string> = {};
    for (const s of stages) {
      if ((s.status === "completed" || s.status === "approved") && s.output) {
        stageOutputs[s.stageKey] = flattenOutputToString(s.output);
      }
    }

    // Determine agent
    const excludeIds: string[] = [];
    let forcedAgentId: string | null = null;

    if (stageDef.sameAgentAs) {
      const refStage = stages.find((s) => s.stageKey === stageDef.sameAgentAs);
      if (refStage?.assignedAgentId) {
        forcedAgentId = refStage.assignedAgentId;
      }
    }

    if (stageDef.differentAgentFrom) {
      const refStage = stages.find((s) => s.stageKey === stageDef.differentAgentFrom);
      if (refStage?.assignedAgentId) {
        excludeIds.push(refStage.assignedAgentId);
      }
    }

    const agentId = forcedAgentId ?? (await pickAgentForRole(run.company_id, stageDef.role, excludeIds));
    if (!agentId) {
      logger.error({ runId, role: stageDef.role }, "no available agent for pipeline stage");
      await failRun(runId);
      return;
    }

    // Interpolate templates
    const input = run.input as { title: string; description: string };
    const title = interpolateTemplate(stageDef.titleTemplate, input, stageOutputs);
    const description = interpolateTemplate(stageDef.descriptionTemplate, input, stageOutputs);

    // Create the issue
    // Use raw insert to avoid circular dependency with issueService
    const [company] = await db.execute<{ issue_counter: number; issue_prefix: string }>(
      sql`UPDATE companies SET issue_counter = issue_counter + 1 WHERE id = ${run.company_id} RETURNING issue_counter, issue_prefix`,
    );
    const issueNumber = company.issue_counter;
    const identifier = `${company.issue_prefix}-${issueNumber}`;

    const [issue] = await db
      .insert(issues)
      .values({
        companyId: run.company_id,
        projectId: run.project_id,
        title,
        description,
        status: "todo",
        priority: "medium",
        assigneeAgentId: agentId,
        issueNumber,
        identifier,
      })
      .returning();

    // Update the stage
    await db
      .update(pipelineStages)
      .set({
        status: "running",
        assignedAgentId: agentId,
        issueId: issue.id,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pipelineStages.id, nextStage.id));

    // Update run's current stage
    await db
      .update(pipelineRuns)
      .set({ currentStageKey: nextStage.stageKey, updatedAt: new Date() })
      .where(eq(pipelineRuns.id, runId));

    logger.info(
      { runId, stageKey: nextStage.stageKey, agentId, issueId: issue.id },
      "pipeline stage started",
    );
  }

  async function failRun(runId: string) {
    await db
      .update(pipelineRuns)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(pipelineRuns.id, runId));

    await db
      .update(pipelineStages)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(pipelineStages.pipelineRunId, runId),
          eq(pipelineStages.status, "pending"),
        ),
      );
  }

  // Hook called when an issue completes (from PATCH /issues/:id)
  async function handleIssueCompleted(issueId: string, issueStatus: string) {
    const stage = await stageOps.getByIssueId(issueId);
    if (!stage) return;

    const run = await db
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, stage.pipelineRunId))
      .then((rows) => rows[0] ?? null);
    if (!run || run.status !== "running") return;

    if (issueStatus === "done") {
      if (stage.type === "review") {
        await db
          .update(pipelineStages)
          .set({ status: "approved", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stage.id));
      } else {
        const output = await captureStageOutput(db, issueId);
        await db
          .update(pipelineStages)
          .set({ status: "completed", output, completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stage.id));
      }
      void advanceRun(stage.pipelineRunId).catch((err) =>
        logger.error({ err, runId: stage.pipelineRunId }, "failed to advance after issue completion"),
      );
    } else if (issueStatus === "cancelled") {
      if (stage.type === "review") {
        await db
          .update(pipelineStages)
          .set({ status: "rejected", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stage.id));
      } else {
        await db
          .update(pipelineStages)
          .set({ status: "cancelled", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(pipelineStages.id, stage.id));
      }
      await failRun(stage.pipelineRunId);
    }
  }

  return {
    templates: templateOps,
    runs: runOps,
    stages: stageOps,
    handleIssueCompleted,
  };
}
