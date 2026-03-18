import { z } from "zod";
import { AGENT_ROLES, PIPELINE_STAGE_TYPES } from "../constants.js";

export const pipelineStageDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  role: z.enum(AGENT_ROLES),
  type: z.enum(PIPELINE_STAGE_TYPES),
  titleTemplate: z.string().min(1),
  descriptionTemplate: z.string().min(1),
  contextFrom: z.string().optional(),
  differentAgentFrom: z.string().optional(),
  sameAgentAs: z.string().optional(),
});

export type PipelineStageDefinition = z.infer<typeof pipelineStageDefinitionSchema>;

export const createPipelineTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  stages: z.array(pipelineStageDefinitionSchema).min(1),
  projectId: z.string().uuid().optional().nullable(),
});

export type CreatePipelineTemplate = z.infer<typeof createPipelineTemplateSchema>;

export const updatePipelineTemplateSchema = createPipelineTemplateSchema.partial();

export type UpdatePipelineTemplate = z.infer<typeof updatePipelineTemplateSchema>;

export const createPipelineRunSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1),
  input: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
  projectId: z.string().uuid().optional().nullable(),
});

export type CreatePipelineRun = z.infer<typeof createPipelineRunSchema>;

export const reviewPipelineStageSchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

export type ReviewPipelineStage = z.infer<typeof reviewPipelineStageSchema>;
