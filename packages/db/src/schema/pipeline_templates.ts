import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { projects } from "./projects.js";
import type { PipelineStageDefinition } from "@paperclipai/shared";

export const pipelineTemplates = pgTable("pipeline_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  stages: jsonb("stages").$type<PipelineStageDefinition[]>().notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyIdx: index("pipeline_templates_company_idx").on(table.companyId),
}));
