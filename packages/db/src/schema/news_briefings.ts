import { pgTable, uuid, text, integer, jsonb, timestamp, date, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";

export const newsBriefings = pgTable("news_briefings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  markdownContent: text("markdown_content").notNull(),
  totalCollected: integer("total_collected").notNull().default(0),
  totalSelected: integer("total_selected").notNull().default(0),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyDateIdx: index("news_briefings_company_date_idx").on(table.companyId, table.date),
  companyAgentIdx: index("news_briefings_company_agent_idx").on(table.companyId, table.agentId),
}));
