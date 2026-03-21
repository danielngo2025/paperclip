import { pgTable, uuid, text, real, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // hackernews, reddit, arxiv, github, rss
  url: text("url").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  category: text("category").notNull().default("ecosystem"), // research, product, ecosystem, startup, events
  entities: jsonb("entities").$type<string[]>().notNull().default([]),
  lane: text("lane"),
  author: text("author"),
  noveltyScore: real("novelty_score"),
  impactScore: real("impact_score"),
  relevanceScore: real("relevance_score"),
  authorityScore: real("authority_score"),
  compositeScore: real("composite_score"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyAgentIdx: index("news_articles_company_agent_idx").on(table.companyId, table.agentId),
  companyCategoryIdx: index("news_articles_company_category_idx").on(table.companyId, table.category),
  collectedAtIdx: index("news_articles_collected_at_idx").on(table.collectedAt),
}));
