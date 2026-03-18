import { pgTable, uuid, text, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { pipelineRuns } from "./pipeline_runs.js";
import { agents } from "./agents.js";
import { issues } from "./issues.js";

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  pipelineRunId: uuid("pipeline_run_id").notNull().references(() => pipelineRuns.id, { onDelete: "cascade" }),
  stageKey: text("stage_key").notNull(),
  stageIndex: integer("stage_index").notNull(),
  role: text("role").notNull(),
  type: text("type").notNull(),
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  issueId: uuid("issue_id").references(() => issues.id),
  status: text("status").notNull().default("pending"),
  output: jsonb("output").$type<Record<string, unknown>>(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  runIdx: index("pipeline_stages_run_idx").on(table.pipelineRunId),
  issueIdx: index("pipeline_stages_issue_idx").on(table.issueId),
  companyRunIdx: index("pipeline_stages_company_run_idx").on(table.companyId, table.pipelineRunId),
}));
