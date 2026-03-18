import { useState } from "react";
import type { PipelineStageDefinition } from "@nexioai/shared";
import { AGENT_ROLES } from "@nexioai/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface PipelineTemplateFormProps {
  initialName?: string;
  initialDescription?: string;
  initialStages?: PipelineStageDefinition[];
  onSubmit: (data: { name: string; description: string; stages: PipelineStageDefinition[] }) => void;
  submitLabel?: string;
  disabled?: boolean;
  error?: string;
  success?: boolean;
}

function emptyStage(): PipelineStageDefinition {
  return {
    key: "",
    label: "",
    role: "engineer",
    type: "execute",
    titleTemplate: "",
    descriptionTemplate: "",
  };
}

export function PipelineTemplateForm({
  initialName = "",
  initialDescription = "",
  initialStages,
  onSubmit,
  submitLabel = "Save",
  disabled = false,
  error,
  success,
}: PipelineTemplateFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [stages, setStages] = useState<PipelineStageDefinition[]>(
    initialStages?.length ? initialStages : [emptyStage()],
  );
  function updateStage(index: number, patch: Partial<PipelineStageDefinition>) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function addStage() {
    setStages((prev) => [...prev, emptyStage()]);
  }

  const canSubmit = name && stages.length > 0 && stages.every((s) => s.key && s.label && s.titleTemplate && s.descriptionTemplate);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Feature Development Pipeline" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Stages</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStage}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Stage
          </Button>
        </div>

        {stages.map((stage, index) => (
          <div key={index} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Stage {index + 1}</span>
              {stages.length > 1 && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeStage(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Key</Label>
                <Input value={stage.key} onChange={(e) => updateStage(index, { key: e.target.value })} placeholder="e.g. plan" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input value={stage.label} onChange={(e) => updateStage(index, { label: e.target.value })} placeholder="e.g. Implementation Plan" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={stage.role} onValueChange={(v) => updateStage(index, { role: v as PipelineStageDefinition["role"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENT_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={stage.type} onValueChange={(v) => updateStage(index, { type: v as "execute" | "review" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="execute">Execute</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title Template</Label>
              <Input value={stage.titleTemplate} onChange={(e) => updateStage(index, { titleTemplate: e.target.value })} placeholder="e.g. Plan: {{input.title}}" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description Template</Label>
              <Textarea value={stage.descriptionTemplate} onChange={(e) => updateStage(index, { descriptionTemplate: e.target.value })} placeholder="Supports {{input.title}}, {{input.description}}, {{stages.plan.output}}" rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Context From</Label>
                <Input value={stage.contextFrom ?? ""} onChange={(e) => updateStage(index, { contextFrom: e.target.value || undefined })} placeholder="Stage key" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Different Agent From</Label>
                <Input value={stage.differentAgentFrom ?? ""} onChange={(e) => updateStage(index, { differentAgentFrom: e.target.value || undefined })} placeholder="Stage key" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Same Agent As</Label>
                <Input value={stage.sameAgentAs ?? ""} onChange={(e) => updateStage(index, { sameAgentAs: e.target.value || undefined })} placeholder="Stage key" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Saved successfully.</p>}
      <Button disabled={!canSubmit || disabled} onClick={() => onSubmit({ name, description, stages })}>
        {submitLabel}
      </Button>
    </div>
  );
}
