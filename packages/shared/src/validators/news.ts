import { z } from "zod";

export const NEWS_CATEGORIES = ["research", "product", "ecosystem", "startup", "events"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_SOURCES = ["hackernews", "reddit", "arxiv", "github", "rss"] as const;
export type NewsSource = (typeof NEWS_SOURCES)[number];

export const createNewsArticleSchema = z.object({
  source: z.string().min(1).max(50),
  url: z.string().url().max(2000),
  title: z.string().min(1).max(500),
  summary: z.string().max(5000).optional().nullable(),
  category: z.enum(NEWS_CATEGORIES).optional().default("ecosystem"),
  entities: z.array(z.string().max(200)).max(20).optional().default([]),
  lane: z.string().max(50).optional().nullable(),
  author: z.string().max(200).optional().nullable(),
  noveltyScore: z.number().min(0).max(1).optional().nullable(),
  impactScore: z.number().min(0).max(1).optional().nullable(),
  relevanceScore: z.number().min(0).max(1).optional().nullable(),
  authorityScore: z.number().min(0).max(1).optional().nullable(),
  compositeScore: z.number().min(0).max(1).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type CreateNewsArticle = z.infer<typeof createNewsArticleSchema>;

export const createNewsBriefingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  markdownContent: z.string().min(1).max(100_000),
  totalCollected: z.number().int().min(0).optional().default(0),
  totalSelected: z.number().int().min(0).optional().default(0),
  topics: z.array(z.string().max(200)).max(50).optional().default([]),
});

export type CreateNewsBriefing = z.infer<typeof createNewsBriefingSchema>;
