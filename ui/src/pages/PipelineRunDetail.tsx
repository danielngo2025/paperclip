import { useEffect } from "react";
import { useParams, Link } from "@/lib/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pipelinesApi } from "../api/pipelines";
import { queryKeys } from "../lib/queryKeys";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { PipelineStageProgress } from "../components/PipelineStageProgress";
import { PageSkeleton } from "../components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ExternalLink, Check, X } from "lucide-react";
import type { PipelineStage } from "@nexioai/shared";

export function PipelineRunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: queryKeys.pipelines.runDetail(runId!),
    queryFn: () => pipelinesApi.getRun(runId!),
    enabled: !!runId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Pipelines", href: "/pipelines" },
      { label: run?.name ?? "Run" },
    ]);
  }, [setBreadcrumbs, run?.name]);

  const cancelRun = useMutation({
    mutationFn: () => pipelinesApi.cancelRun(runId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.runDetail(runId!) }),
  });

  const reviewStage = useMutation({
    mutationFn: ({ stageId, decision }: { stageId: string; decision: "approve" | "reject" }) =>
      pipelinesApi.reviewStage(stageId, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.runDetail(runId!) }),
  });

  if (isLoading || !run) {
    return <PageSkeleton variant="detail" />;
  }

  const stageLabels = run.stageSnapshot
    ? Object.fromEntries(run.stageSnapshot.map((s) => [s.key, s.label]))
    : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{run.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {run.input.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={run.status === "running" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>
            {run.status}
          </Badge>
          {(run.status === "running" || run.status === "pending") && (
            <Button variant="outline" size="sm" onClick={() => cancelRun.mutate()}>
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {run.stages && <PipelineStageProgress stages={run.stages} stageLabels={stageLabels} />}

      <div className="space-y-3">
        {run.stages?.map((stage: PipelineStage) => {
          const def = run.stageSnapshot?.find((s) => s.key === stage.stageKey);
          return (
            <Card key={stage.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {def?.label ?? stage.stageKey}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({stage.type}) &middot; {stage.role}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {stage.issueId && (
                      <Link to={`/issues/${stage.issueId}`}>
                        <Button variant="ghost" size="icon-sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    {stage.type === "review" && stage.status === "running" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => reviewStage.mutate({ stageId: stage.id, decision: "approve" })}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => reviewStage.mutate({ stageId: stage.id, decision: "reject" })}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Badge variant="outline" className="text-xs">{stage.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              {(stage.assignedAgentId || stage.startedAt) && (
                <CardContent className="py-2 px-4 text-xs text-muted-foreground">
                  {stage.assignedAgentId && <span>Agent: {stage.assignedAgentId.slice(0, 8)}...</span>}
                  {stage.startedAt && <span className="ml-3">Started: {new Date(stage.startedAt).toLocaleString()}</span>}
                  {stage.completedAt && <span className="ml-3">Completed: {new Date(stage.completedAt).toLocaleString()}</span>}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
