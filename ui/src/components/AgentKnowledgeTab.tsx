import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AgentKnowledgeEntry, KnowledgeEntryType } from "@nexioai/shared";
import { KNOWLEDGE_ENTRY_TYPES } from "@nexioai/shared";
import { agentsApi } from "../api/agents";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileText, Link2, Key, Trash2, Pencil, Pin } from "lucide-react";
import { cn } from "../lib/utils";

const TYPE_ICONS: Record<KnowledgeEntryType, typeof FileText> = {
  note: FileText,
  link: Link2,
  fact: Key,
};

const TYPE_LABELS: Record<KnowledgeEntryType, string> = {
  note: "Note",
  link: "Link",
  fact: "Fact",
};

interface AgentKnowledgeTabProps {
  agentId: string;
}

export function AgentKnowledgeTab({ agentId }: AgentKnowledgeTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AgentKnowledgeEntry | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: queryKeys.agents.knowledge(agentId),
    queryFn: () => agentsApi.listKnowledge(agentId),
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId: string) => agentsApi.deleteKnowledge(agentId, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.knowledge(agentId) }),
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ entryId, enabled }: { entryId: string; enabled: boolean }) =>
      agentsApi.updateKnowledge(agentId, entryId, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.knowledge(agentId) }),
  });

  const togglePinned = useMutation({
    mutationFn: ({ entryId, pinned }: { entryId: string; pinned: boolean }) =>
      agentsApi.updateKnowledge(agentId, entryId, { pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.knowledge(agentId) }),
  });

  const filtered = (entries ?? []).filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (e.title ?? "").toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        (e.factKey ?? "").toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function openCreate() {
    setEditingEntry(null);
    setDialogOpen(true);
  }

  function openEdit(entry: AgentKnowledgeEntry) {
    setEditingEntry(entry);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search knowledge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-60"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {KNOWLEDGE_ENTRY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Knowledge
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No knowledge entries yet.</p>
          <p className="text-xs mt-1">Add notes, links, or facts to help this agent learn.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((entry) => {
          const Icon = TYPE_ICONS[entry.type as KnowledgeEntryType] ?? FileText;
          return (
            <div
              key={entry.id}
              className={cn(
                "rounded-lg border p-3 flex gap-3",
                !entry.enabled && "opacity-50",
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {entry.pinned && <Pin className="h-3 w-3 text-blue-500" />}
                  <span className="text-sm font-medium truncate">
                    {entry.type === "fact" && entry.factKey
                      ? `${entry.factKey}: `
                      : ""}
                    {entry.title ?? (entry.type === "link" ? entry.content : entry.content.slice(0, 60))}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABELS[entry.type as KnowledgeEntryType]}</Badge>
                </div>
                {entry.type === "note" && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                )}
                {entry.type === "link" && entry.title && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{entry.content}</p>
                )}
                {entry.type === "fact" && (
                  <p className="text-xs text-muted-foreground mt-1">{entry.content}</p>
                )}
                {entry.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-start gap-1 shrink-0">
                <Checkbox
                  checked={entry.enabled}
                  onCheckedChange={(checked: boolean) => toggleEnabled.mutate({ entryId: entry.id, enabled: checked })}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => togglePinned.mutate({ entryId: entry.id, pinned: !entry.pinned })}>
                  <Pin className={cn("h-3.5 w-3.5", entry.pinned ? "text-blue-500" : "text-muted-foreground")} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(entry)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => deleteEntry.mutate(entry.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <KnowledgeEntryDialog
        agentId={agentId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEntry={editingEntry}
      />
    </div>
  );
}

function KnowledgeEntryDialog({
  agentId,
  open,
  onOpenChange,
  editingEntry,
}: {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry: AgentKnowledgeEntry | null;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<KnowledgeEntryType>(editingEntry?.type as KnowledgeEntryType ?? "note");
  const [title, setTitle] = useState(editingEntry?.title ?? "");
  const [content, setContent] = useState(editingEntry?.content ?? "");
  const [factKey, setFactKey] = useState(editingEntry?.factKey ?? "");
  const [tags, setTags] = useState(editingEntry?.tags?.join(", ") ?? "");
  const [pinned, setPinned] = useState(editingEntry?.pinned ?? false);

  // Reset form when dialog opens with new entry
  const [lastEntryId, setLastEntryId] = useState<string | null>(null);
  if ((editingEntry?.id ?? null) !== lastEntryId) {
    setLastEntryId(editingEntry?.id ?? null);
    setType(editingEntry?.type as KnowledgeEntryType ?? "note");
    setTitle(editingEntry?.title ?? "");
    setContent(editingEntry?.content ?? "");
    setFactKey(editingEntry?.factKey ?? "");
    setTags(editingEntry?.tags?.join(", ") ?? "");
    setPinned(editingEntry?.pinned ?? false);
  }

  const createEntry = useMutation({
    mutationFn: (data: Record<string, unknown>) => agentsApi.createKnowledge(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.knowledge(agentId) });
      onOpenChange(false);
      resetForm();
    },
  });

  const updateEntry = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      agentsApi.updateKnowledge(agentId, editingEntry!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.knowledge(agentId) });
      onOpenChange(false);
    },
  });

  function resetForm() {
    setType("note");
    setTitle("");
    setContent("");
    setFactKey("");
    setTags("");
    setPinned(false);
    setLastEntryId(null);
  }

  function handleSubmit() {
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const data = {
      type,
      title: title || null,
      content,
      factKey: type === "fact" ? factKey || null : null,
      tags: parsedTags,
      pinned,
    };
    if (editingEntry) {
      updateEntry.mutate(data);
    } else {
      createEntry.mutate(data);
    }
  }

  const canSubmit = content.trim() && (type !== "fact" || factKey.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingEntry ? "Edit Knowledge" : "Add Knowledge"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as KnowledgeEntryType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note — free-form text</SelectItem>
                <SelectItem value="link">Link — URL reference</SelectItem>
                <SelectItem value="fact">Fact — key-value pair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{type === "link" ? "Label" : "Title"} (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "link" ? "e.g. Go Style Guide" : "e.g. Auth implementation note"} />
          </div>
          {type === "fact" && (
            <div className="space-y-2">
              <Label>Key</Label>
              <Input value={factKey} onChange={(e) => setFactKey(e.target.value)} placeholder="e.g. database_engine" />
            </div>
          )}
          <div className="space-y-2">
            <Label>{type === "link" ? "URL" : type === "fact" ? "Value" : "Content"}</Label>
            {type === "note" ? (
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Knowledge content..." rows={5} />
            ) : (
              <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder={type === "link" ? "https://..." : "Value"} />
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. golang, auth, best-practices" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={pinned} onCheckedChange={(v: boolean) => setPinned(v)} />
            <Label className="text-sm">Pin (always included in agent prompt)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSubmit || createEntry.isPending || updateEntry.isPending} onClick={handleSubmit}>
            {editingEntry ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
