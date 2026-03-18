import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PipelineTemplate } from "@nexioai/shared";
import { pipelinesApi } from "../api/pipelines";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface PipelineCreateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTemplateId?: string;
}

export function PipelineCreateRunDialog({
  open,
  onOpenChange,
  preselectedTemplateId,
}: PipelineCreateRunDialogProps) {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState(preselectedTemplateId ?? "");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: templates } = useQuery({
    queryKey: queryKeys.pipelines.templates(selectedCompanyId!),
    queryFn: () => pipelinesApi.listTemplates(selectedCompanyId!),
    enabled: !!selectedCompanyId && open,
  });

  const startRun = useMutation({
    mutationFn: () =>
      pipelinesApi.startRun(selectedCompanyId!, {
        templateId,
        name,
        input: { title, description },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.runs(selectedCompanyId!) });
      onOpenChange(false);
      setName("");
      setTitle("");
      setDescription("");
      setTemplateId("");
    },
  });

  const canSubmit = templateId && name && title && description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Pipeline Run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t: PipelineTemplate) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Run Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Feature: User Profiles"
            />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add user profile page"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be built..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || startRun.isPending}
            onClick={() => startRun.mutate()}
          >
            {startRun.isPending ? "Starting..." : "Start Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
