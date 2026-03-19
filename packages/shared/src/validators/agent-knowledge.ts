import { z } from "zod";

export const KNOWLEDGE_ENTRY_TYPES = ["note", "link", "fact"] as const;
export type KnowledgeEntryType = (typeof KNOWLEDGE_ENTRY_TYPES)[number];

export const createAgentKnowledgeSchema = z.object({
  type: z.enum(KNOWLEDGE_ENTRY_TYPES),
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(50_000),
  factKey: z.string().max(200).optional().nullable(),
  tags: z.array(z.string().max(100)).max(20).optional().default([]),
  pinned: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export type CreateAgentKnowledge = z.infer<typeof createAgentKnowledgeSchema>;

export const updateAgentKnowledgeSchema = createAgentKnowledgeSchema.partial();

export type UpdateAgentKnowledge = z.infer<typeof updateAgentKnowledgeSchema>;
