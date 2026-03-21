import { Router } from "express";
import type { Db } from "@nexioai/db";
import { createNewsArticleSchema, createNewsBriefingSchema } from "@nexioai/shared";
import { validate } from "../middleware/validate.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { newsService } from "../services/news.js";
import { logActivity } from "../services/activity-log.js";
import type { CreateNewsArticle } from "@nexioai/shared";

function toArticleInsert(data: CreateNewsArticle) {
  return {
    ...data,
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
  };
}

export function newsRoutes(db: Db) {
  const router = Router();
  const svc = newsService(db);

  // List news articles for a company
  router.get("/companies/:companyId/news/articles", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { agentId, category, limit } = req.query as { agentId?: string; category?: string; limit?: string };
    const articles = await svc.listArticles(companyId, {
      agentId,
      category,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(articles);
  });

  // Get single article
  router.get("/news/articles/:id", async (req, res) => {
    const article = await svc.getArticle(req.params.id as string);
    if (!article) { res.status(404).json({ error: "Article not found" }); return; }
    assertCompanyAccess(req, article.companyId);
    res.json(article);
  });

  // Create article (agent-facing)
  router.post(
    "/companies/:companyId/agents/:agentId/news/articles",
    validate(createNewsArticleSchema),
    async (req, res) => {
      const { companyId, agentId } = req.params as { companyId: string; agentId: string };
      assertCompanyAccess(req, companyId);
      const article = await svc.createArticle(agentId, companyId, toArticleInsert(req.body));
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "news_article.created",
        entityType: "news_article",
        entityId: article.id,
      });
      res.status(201).json(article);
    },
  );

  // Batch create articles (agent-facing)
  router.post(
    "/companies/:companyId/agents/:agentId/news/articles/batch",
    async (req, res) => {
      const { companyId, agentId } = req.params as { companyId: string; agentId: string };
      assertCompanyAccess(req, companyId);
      const items = req.body as unknown[];
      const parsed = items.map((item) => toArticleInsert(createNewsArticleSchema.parse(item)));
      const articles = await svc.createArticlesBatch(agentId, companyId, parsed);
      res.status(201).json(articles);
    },
  );

  // Delete article
  router.delete("/news/articles/:id", async (req, res) => {
    const article = await svc.getArticle(req.params.id as string);
    if (!article) { res.status(404).json({ error: "Article not found" }); return; }
    assertCompanyAccess(req, article.companyId);
    await svc.deleteArticle(article.id);
    res.json({ ok: true });
  });

  // List briefings for a company
  router.get("/companies/:companyId/news/briefings", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { agentId, limit } = req.query as { agentId?: string; limit?: string };
    const briefings = await svc.listBriefings(companyId, {
      agentId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(briefings);
  });

  // Get single briefing
  router.get("/news/briefings/:id", async (req, res) => {
    const briefing = await svc.getBriefing(req.params.id as string);
    if (!briefing) { res.status(404).json({ error: "Briefing not found" }); return; }
    assertCompanyAccess(req, briefing.companyId);
    res.json(briefing);
  });

  // Create briefing (agent-facing)
  router.post(
    "/companies/:companyId/agents/:agentId/news/briefings",
    validate(createNewsBriefingSchema),
    async (req, res) => {
      const { companyId, agentId } = req.params as { companyId: string; agentId: string };
      assertCompanyAccess(req, companyId);
      const briefing = await svc.createBriefing(agentId, companyId, req.body);
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "news_briefing.created",
        entityType: "news_briefing",
        entityId: briefing.id,
      });
      res.status(201).json(briefing);
    },
  );

  // Delete briefing
  router.delete("/news/briefings/:id", async (req, res) => {
    const briefing = await svc.getBriefing(req.params.id as string);
    if (!briefing) { res.status(404).json({ error: "Briefing not found" }); return; }
    assertCompanyAccess(req, briefing.companyId);
    await svc.deleteBriefing(briefing.id);
    res.json({ ok: true });
  });

  // News stats
  router.get("/companies/:companyId/news/stats", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const stats = await svc.stats(companyId);
    res.json(stats);
  });

  return router;
}
