import { and, asc, desc, eq } from "drizzle-orm";
import type { Db } from "@nexioai/db";
import { agentKnowledge } from "@nexioai/db";

const PROMPT_BUDGET_CHARS = 8000;

export function agentKnowledgeService(db: Db) {
  return {
    list: (agentId: string) =>
      db
        .select()
        .from(agentKnowledge)
        .where(eq(agentKnowledge.agentId, agentId))
        .orderBy(desc(agentKnowledge.pinned), asc(agentKnowledge.sortOrder), asc(agentKnowledge.createdAt)),

    getById: (id: string) =>
      db
        .select()
        .from(agentKnowledge)
        .where(eq(agentKnowledge.id, id))
        .then((rows) => rows[0] ?? null),

    create: (agentId: string, companyId: string, data: Omit<typeof agentKnowledge.$inferInsert, "agentId" | "companyId">) =>
      db
        .insert(agentKnowledge)
        .values({ ...data, agentId, companyId })
        .returning()
        .then((rows) => rows[0]),

    update: (id: string, data: Partial<typeof agentKnowledge.$inferInsert>) =>
      db
        .update(agentKnowledge)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(agentKnowledge.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    remove: (id: string) =>
      db
        .delete(agentKnowledge)
        .where(eq(agentKnowledge.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    buildPromptBlock: async (agentId: string): Promise<string> => {
      const entries = await db
        .select()
        .from(agentKnowledge)
        .where(and(eq(agentKnowledge.agentId, agentId), eq(agentKnowledge.enabled, true)))
        .orderBy(desc(agentKnowledge.pinned), asc(agentKnowledge.sortOrder), asc(agentKnowledge.createdAt));

      if (entries.length === 0) return "";

      const notes: string[] = [];
      const facts: string[] = [];
      const links: string[] = [];

      for (const entry of entries) {
        if (entry.type === "note") {
          const label = entry.title ? `**${entry.title}**: ` : "";
          notes.push(`- ${label}${entry.content}`);
        } else if (entry.type === "fact") {
          facts.push(`- **${entry.factKey ?? entry.title ?? "info"}**: ${entry.content}`);
        } else if (entry.type === "link") {
          links.push(`- [${entry.title ?? entry.content}](${entry.content})`);
        }
      }

      const sections: string[] = ["## Agent Knowledge Base\n"];
      if (facts.length > 0) sections.push("### Key Facts\n" + facts.join("\n"));
      if (notes.length > 0) sections.push("### Notes\n" + notes.join("\n"));
      if (links.length > 0) sections.push("### Reference Links\n" + links.join("\n"));

      let block = sections.join("\n\n");
      if (block.length > PROMPT_BUDGET_CHARS) {
        block = block.slice(0, PROMPT_BUDGET_CHARS) + "\n\n[Knowledge truncated — " + entries.length + " entries total]";
      }
      return block;
    },
  };
}
