import { useEffect } from "react";
import { useParams } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowLeft } from "lucide-react";
import { newsApi } from "../api/news";
import { agentsApi } from "../api/agents";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";

export function NewsBriefingDetail() {
  const { briefingId } = useParams<{ briefingId: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  const { data: briefing, isLoading } = useQuery({
    queryKey: queryKeys.news.briefingDetail(briefingId!),
    queryFn: () => newsApi.getBriefing(briefingId!),
    enabled: !!briefingId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const agent = agents?.find((a) => a.id === briefing?.agentId);

  useEffect(() => {
    setBreadcrumbs([
      { label: "News", href: "/news" },
      { label: briefing?.date ?? "Briefing" },
    ]);
  }, [setBreadcrumbs, briefing?.date]);

  if (isLoading) return <PageSkeleton variant="detail" />;
  if (!briefing) return <div className="text-sm text-muted-foreground py-8 text-center">Briefing not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/news">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{briefing.date}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {agent && <span>by {agent.name}</span>}
            <span>{briefing.totalCollected} collected</span>
            <span>{briefing.totalSelected} selected</span>
          </div>
        </div>
      </div>

      {briefing.topics.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {briefing.topics.map((t) => (
            <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      )}

      <div className="border border-border">
        <div className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:text-foreground
          prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-1 prose-h2:border-b prose-h2:border-border
          prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
          prose-p:text-muted-foreground prose-p:text-[13px] prose-p:leading-relaxed
          prose-li:text-muted-foreground prose-li:text-[13px]
          prose-a:text-foreground prose-a:underline prose-a:decoration-muted-foreground/40
          prose-strong:text-foreground prose-strong:font-medium
          prose-hr:border-border
        ">
          <BriefingMarkdown content={briefing.markdownContent} />
        </div>
      </div>
    </div>
  );
}

function BriefingMarkdown({ content }: { content: string }) {
  // Simple markdown-to-HTML for briefing display
  const html = markdownToHtml(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function markdownToHtml(md: string): string {
  let html = md
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    // List items
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Paragraphs: wrap lines that aren't already tags
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(h[1-6]|ul|ol|li|blockquote|hr|div|p)/.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
