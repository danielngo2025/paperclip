import type { KnowledgeEntryType } from "../validators/agent-knowledge.js";

export interface AgentKnowledgeEntry {
  id: string;
  companyId: string;
  agentId: string;
  type: KnowledgeEntryType;
  title: string | null;
  content: string;
  factKey: string | null;
  tags: string[];
  pinned: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
