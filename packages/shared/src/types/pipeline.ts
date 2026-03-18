import type { PipelineRunStatus, PipelineStageStatus, PipelineStageType } from "../constants.js";
import type { PipelineStageDefinition } from "../validators/pipeline.js";

export interface PipelineTemplate {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  stages: PipelineStageDefinition[];
  projectId: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineRun {
  id: string;
  companyId: string;
  templateId: string;
  name: string;
  status: PipelineRunStatus;
  currentStageKey: string | null;
  input: { title: string; description: string };
  stageSnapshot: PipelineStageDefinition[];
  projectId: string | null;
  createdByUserId: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  companyId: string;
  pipelineRunId: string;
  stageKey: string;
  stageIndex: number;
  role: string;
  type: PipelineStageType;
  assignedAgentId: string | null;
  issueId: string | null;
  status: PipelineStageStatus;
  output: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
