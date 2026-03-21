import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@nexioai/db";
import { newsArticles, newsBriefings } from "@nexioai/db";

export function newsService(db: Db) {
  return {
    listArticles: (companyId: string, opts?: { agentId?: string; category?: string; limit?: number }) => {
      const conditions = [eq(newsArticles.companyId, companyId)];
      if (opts?.agentId) conditions.push(eq(newsArticles.agentId, opts.agentId));
      if (opts?.category) conditions.push(eq(newsArticles.category, opts.category));

      return db
        .select()
        .from(newsArticles)
        .where(and(...conditions))
        .orderBy(desc(newsArticles.collectedAt))
        .limit(opts?.limit ?? 100);
    },

    getArticle: (id: string) =>
      db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.id, id))
        .then((rows) => rows[0] ?? null),

    createArticle: (agentId: string, companyId: string, data: Omit<typeof newsArticles.$inferInsert, "agentId" | "companyId">) =>
      db
        .insert(newsArticles)
        .values({ ...data, agentId, companyId })
        .returning()
        .then((rows) => rows[0]),

    createArticlesBatch: (agentId: string, companyId: string, items: Omit<typeof newsArticles.$inferInsert, "agentId" | "companyId">[]) =>
      db
        .insert(newsArticles)
        .values(items.map((item) => ({ ...item, agentId, companyId })))
        .returning(),

    deleteArticle: (id: string) =>
      db
        .delete(newsArticles)
        .where(eq(newsArticles.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    listBriefings: (companyId: string, opts?: { agentId?: string; limit?: number }) => {
      const conditions = [eq(newsBriefings.companyId, companyId)];
      if (opts?.agentId) conditions.push(eq(newsBriefings.agentId, opts.agentId));

      return db
        .select()
        .from(newsBriefings)
        .where(and(...conditions))
        .orderBy(desc(newsBriefings.date))
        .limit(opts?.limit ?? 50);
    },

    getBriefing: (id: string) =>
      db
        .select()
        .from(newsBriefings)
        .where(eq(newsBriefings.id, id))
        .then((rows) => rows[0] ?? null),

    getBriefingByDate: (companyId: string, date: string) =>
      db
        .select()
        .from(newsBriefings)
        .where(and(eq(newsBriefings.companyId, companyId), eq(newsBriefings.date, date)))
        .then((rows) => rows[0] ?? null),

    createBriefing: (agentId: string, companyId: string, data: Omit<typeof newsBriefings.$inferInsert, "agentId" | "companyId">) =>
      db
        .insert(newsBriefings)
        .values({ ...data, agentId, companyId })
        .returning()
        .then((rows) => rows[0]),

    deleteBriefing: (id: string) =>
      db
        .delete(newsBriefings)
        .where(eq(newsBriefings.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    stats: (companyId: string) =>
      db
        .select({
          totalArticles: sql<number>`count(*)`,
          sources: sql<string[]>`array_agg(distinct ${newsArticles.source})`,
        })
        .from(newsArticles)
        .where(eq(newsArticles.companyId, companyId))
        .then((rows) => rows[0]),
  };
}
