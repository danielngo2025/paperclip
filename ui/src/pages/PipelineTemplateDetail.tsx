import { useEffect } from "react";
import { useParams, useNavigate } from "@/lib/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pipelinesApi } from "../api/pipelines";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { PipelineTemplateForm } from "../components/PipelineTemplateForm";
import { PageSkeleton } from "../components/PageSkeleton";

export function PipelineTemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const isNew = !templateId;

  const { data: template, isLoading } = useQuery({
    queryKey: queryKeys.pipelines.templateDetail(templateId!),
    queryFn: () => pipelinesApi.getTemplate(templateId!),
    enabled: !!templateId && !isNew,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Pipelines", href: "/pipelines" },
      { label: isNew ? "New Template" : template?.name ?? "Template" },
    ]);
  }, [setBreadcrumbs, isNew, template?.name]);

  const createTemplate = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      pipelinesApi.createTemplate(selectedCompanyId!, data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.templates(selectedCompanyId!) });
      navigate(`/pipelines/templates/${created.id}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      pipelinesApi.updateTemplate(templateId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.templateDetail(templateId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.templates(selectedCompanyId!) });
    },
  });

  if (!isNew && isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  return (
    <div className="max-w-2xl">
      <PipelineTemplateForm
        key={template?.id ?? "new"}
        initialName={template?.name}
        initialDescription={template?.description ?? ""}
        initialStages={template?.stages}
        submitLabel={isNew ? "Create Template" : "Update Template"}
        disabled={createTemplate.isPending || updateTemplate.isPending}
        onSubmit={(data) => {
          if (isNew) {
            createTemplate.mutate(data);
          } else {
            updateTemplate.mutate(data);
          }
        }}
        error={updateTemplate.error?.message ?? createTemplate.error?.message}
        success={updateTemplate.isSuccess}
      />
    </div>
  );
}
