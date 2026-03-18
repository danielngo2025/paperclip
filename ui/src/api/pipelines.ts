import type { PipelineTemplate, PipelineRun, PipelineStage } from "@nexioai/shared";
import { api } from "./client";

export const pipelinesApi = {
  // Templates
  listTemplates: (companyId: string) =>
    api.get<PipelineTemplate[]>(`/companies/${companyId}/pipeline-templates`),
  getTemplate: (id: string) => api.get<PipelineTemplate>(`/pipeline-templates/${id}`),
  createTemplate: (companyId: string, data: Record<string, unknown>) =>
    api.post<PipelineTemplate>(`/companies/${companyId}/pipeline-templates`, data),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    api.patch<PipelineTemplate>(`/pipeline-templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete<PipelineTemplate>(`/pipeline-templates/${id}`),

  // Runs
  listRuns: (companyId: string) =>
    api.get<PipelineRun[]>(`/companies/${companyId}/pipeline-runs`),
  getRun: (id: string) => api.get<PipelineRun & { stages: PipelineStage[] }>(`/pipeline-runs/${id}`),
  startRun: (companyId: string, data: Record<string, unknown>) =>
    api.post<PipelineRun & { stages: PipelineStage[] }>(`/companies/${companyId}/pipeline-runs`, data),
  cancelRun: (id: string) =>
    api.post<PipelineRun>(`/pipeline-runs/${id}/cancel`, {}),

  // Stages
  reviewStage: (stageId: string, decision: "approve" | "reject") =>
    api.post<PipelineStage>(`/pipeline-stages/${stageId}/review`, { decision }),
};
