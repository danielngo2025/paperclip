import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";

export const agentKnowledge = pgTable("agent_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "note" | "link" | "fact"
  title: text("title"),
  content: text("content").notNull(),
  factKey: text("fact_key"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  pinned: boolean("pinned").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  agentEnabledIdx: index("agent_knowledge_agent_enabled_idx").on(table.agentId, table.enabled),
  companyAgentIdx: index("agent_knowledge_company_agent_idx").on(table.companyId, table.agentId),
}));
