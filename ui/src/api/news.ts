import type { NewsArticle, NewsBriefing } from "@nexioai/shared";
import { api } from "./client";

export const newsApi = {
  listArticles: (companyId: string, opts?: { agentId?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (opts?.agentId) params.set("agentId", opts.agentId);
    if (opts?.category) params.set("category", opts.category);
    const qs = params.toString();
    return api.get<NewsArticle[]>(`/companies/${companyId}/news/articles${qs ? `?${qs}` : ""}`);
  },

  getArticle: (id: string) => api.get<NewsArticle>(`/news/articles/${id}`),

  deleteArticle: (id: string) => api.delete<{ ok: boolean }>(`/news/articles/${id}`),

  listBriefings: (companyId: string, opts?: { agentId?: string }) => {
    const params = new URLSearchParams();
    if (opts?.agentId) params.set("agentId", opts.agentId);
    const qs = params.toString();
    return api.get<NewsBriefing[]>(`/companies/${companyId}/news/briefings${qs ? `?${qs}` : ""}`);
  },

  getBriefing: (id: string) => api.get<NewsBriefing>(`/news/briefings/${id}`),

  deleteBriefing: (id: string) => api.delete<{ ok: boolean }>(`/news/briefings/${id}`),

  stats: (companyId: string) =>
    api.get<{ totalArticles: number; sources: string[] }>(`/companies/${companyId}/news/stats`),
};
