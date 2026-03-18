import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { pipelineTemplates } from "./pipeline_templates.js";
import { projects } from "./projects.js";
import type { PipelineStageDefinition } from "@nexioai/shared";

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  templateId: uuid("template_id").notNull().references(() => pipelineTemplates.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  currentStageKey: text("current_stage_key"),
  input: jsonb("input").$type<{ title: string; description: string }>().notNull(),
  stageSnapshot: jsonb("stage_snapshot").$type<PipelineStageDefinition[]>().notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  createdByUserId: text("created_by_user_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyStatusIdx: index("pipeline_runs_company_status_idx").on(table.companyId, table.status),
  templateIdx: index("pipeline_runs_template_idx").on(table.templateId),
}));
