import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/lib/router";
import { pipelinesApi } from "../api/pipelines";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { PipelineCreateRunDialog } from "../components/PipelineCreateRunDialog";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, Play, Trash2 } from "lucide-react";
import type { PipelineTemplate, PipelineRun } from "@paperclipai/shared";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  running: "default",
  completed: "secondary",
  failed: "destructive",
  cancelled: "outline",
};

export function Pipelines() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [runDialogOpen, setRunDialogOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Pipelines" }]);
  }, [setBreadcrumbs]);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.pipelines.templates(selectedCompanyId!),
    queryFn: () => pipelinesApi.listTemplates(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: queryKeys.pipelines.runs(selectedCompanyId!),
    queryFn: () => pipelinesApi.listRuns(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 5000,
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => pipelinesApi.deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.templates(selectedCompanyId!) }),
  });

  if (!selectedCompanyId) {
    return <EmptyState icon={GitBranch} message="Select a company to view pipelines." />;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="runs">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setRunDialogOpen(true)}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Start Run
            </Button>
            <Link to="/pipelines/templates/new">
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Template
              </Button>
            </Link>
          </div>
        </div>

        <TabsContent value="runs" className="mt-4">
          {runsLoading ? (
            <PageSkeleton variant="list" />
          ) : !runs?.length ? (
            <EmptyState icon={GitBranch} message="No pipeline runs yet." action="Start Run" onAction={() => setRunDialogOpen(true)} />
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border">
              {runs.map((run: PipelineRun) => (
                <Link
                  key={run.id}
                  to={`/pipelines/runs/${run.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{run.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {run.input.title} &middot; {new Date(run.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>{run.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {templatesLoading ? (
            <PageSkeleton variant="list" />
          ) : !templates?.length ? (
            <EmptyState icon={GitBranch} message="No pipeline templates yet." action="New Template" onAction={() => {}} />
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border">
              {templates.map((t: PipelineTemplate) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <Link to={`/pipelines/templates/${t.id}`} className="min-w-0 flex-1 hover:underline">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.stages.length} stages &middot; {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteTemplate.mutate(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PipelineCreateRunDialog open={runDialogOpen} onOpenChange={setRunDialogOpen} />
    </div>
  );
}
