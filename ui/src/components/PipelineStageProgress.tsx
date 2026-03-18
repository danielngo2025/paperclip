import type { PipelineStage } from "@paperclipai/shared";
import { cn } from "@/lib/utils";
import { Check, X, Loader2, Clock, Ban } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Check; label: string }> = {
  pending: { color: "text-muted-foreground", icon: Clock, label: "Pending" },
  running: { color: "text-blue-500", icon: Loader2, label: "Running" },
  completed: { color: "text-green-500", icon: Check, label: "Completed" },
  approved: { color: "text-green-500", icon: Check, label: "Approved" },
  rejected: { color: "text-destructive", icon: X, label: "Rejected" },
  skipped: { color: "text-muted-foreground", icon: Ban, label: "Skipped" },
  cancelled: { color: "text-muted-foreground", icon: Ban, label: "Cancelled" },
};

interface PipelineStageProgressProps {
  stages: PipelineStage[];
  stageLabels?: Record<string, string>;
}

export function PipelineStageProgress({ stages, stageLabels }: PipelineStageProgressProps) {
  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto">
      {stages.map((stage, index) => {
        const config = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.pending;
        const Icon = config.icon;
        const label = stageLabels?.[stage.stageKey] ?? stage.stageKey;
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.id} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
                stage.status === "running" && "border-blue-500/30 bg-blue-500/5",
                (stage.status === "completed" || stage.status === "approved") && "border-green-500/30 bg-green-500/5",
                (stage.status === "rejected" || stage.status === "cancelled") && "border-destructive/30 bg-destructive/5",
                stage.status === "pending" && "border-border",
              )}
            >
              <Icon
                className={cn("h-3.5 w-3.5 shrink-0", config.color, stage.status === "running" && "animate-spin")}
              />
              <span className="truncate max-w-[120px]">{label}</span>
            </div>
            {!isLast && (
              <div className={cn(
                "h-px w-4 shrink-0",
                (stage.status === "completed" || stage.status === "approved") ? "bg-green-500/50" : "bg-border",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
