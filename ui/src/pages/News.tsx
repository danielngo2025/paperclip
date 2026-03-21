import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, Calendar, Tag, TrendingUp, Plus } from "lucide-react";
import { newsApi } from "../api/news";
import { agentsApi } from "../api/agents";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useDialog } from "../context/DialogContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Agent, NewsBriefing, NewsArticle } from "@nexioai/shared";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    hackernews: "HN",
    reddit: "Reddit",
    arxiv: "arXiv",
    github: "GitHub",
    rss: "RSS",
  };
  return map[source] ?? source;
}

const categoryColors: Record<string, string> = {
  research: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  product: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ecosystem: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  startup: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  events: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-muted-foreground">{pct}%</span>
    </div>
  );
}

function ArticleRow({ article, agentMap }: { article: NewsArticle; agentMap: Map<string, Agent> }) {
  const agent = agentMap.get(article.agentId);
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[article.category] ?? "bg-muted text-muted-foreground"}`}>
              {article.category}
            </span>
            <span className="text-[11px] text-muted-foreground">{sourceLabel(article.source)}</span>
            <span className="text-[11px] text-muted-foreground">{relativeTime(article.collectedAt)}</span>
            {agent && <span className="text-[11px] text-muted-foreground">via {agent.name}</span>}
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground hover:underline inline-flex items-center gap-1"
          >
            {article.title}
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </a>
          {article.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
          )}
          {article.entities.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              {article.entities.slice(0, 5).map((e) => (
                <span key={e} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">{e}</span>
              ))}
            </div>
          )}
        </div>
        {article.compositeScore != null && (
          <div className="shrink-0 w-28 space-y-1 pt-1">
            <div className="text-xs font-medium text-right mb-1">
              Score: {(article.compositeScore * 100).toFixed(0)}
            </div>
            <ScoreBar label="Novelty" value={article.noveltyScore} />
            <ScoreBar label="Impact" value={article.impactScore} />
            <ScoreBar label="Relevance" value={article.relevanceScore} />
          </div>
        )}
      </div>
    </div>
  );
}

function BriefingCard({ briefing, agentMap }: { briefing: NewsBriefing; agentMap: Map<string, Agent> }) {
  const agent = agentMap.get(briefing.agentId);
  return (
    <Link
      to={`/news/briefings/${briefing.id}`}
      className="block border border-border hover:bg-accent/30 transition-colors"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{briefing.date}</span>
          </div>
          {agent && <span className="text-[11px] text-muted-foreground">by {agent.name}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>{briefing.totalCollected} collected</span>
          <span>{briefing.totalSelected} selected</span>
        </div>
        {briefing.topics.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {briefing.topics.slice(0, 6).map((t) => (
              <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">{t}</span>
            ))}
            {briefing.topics.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{briefing.topics.length - 6}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function News() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openNewIssue } = useDialog();
  const [view, setView] = useState<string>("briefings");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const handleCollectNews = () => {
    const today = new Date().toISOString().split("T")[0];
    openNewIssue({
      title: `Collect News — ${today}`,
      description: [
        "Collect AI/ML news from the following sources and post results to the News API.",
        "",
        "**Sources to collect from:**",
        "- Hacker News — search for: AI, LLM, GPT, machine learning, deep learning, neural network, transformer, anthropic, openai, generative",
        "- Reddit — subreddits: MachineLearning, artificial, LocalLLaMA, singularity",
        "- arXiv — categories: cs.AI, cs.CL, cs.LG, cs.CV",
        "- GitHub — trending AI/ML repos with 50+ stars from the past 7 days",
        "- RSS — Google AI Blog, OpenAI Blog, DeepMind, Hugging Face, MIT Tech Review, Microsoft AI",
        "",
        "**Pipeline:**",
        "1. Collect signals from each source (aim for 50-200 per source)",
        "2. Extract & summarize each: title, summary, category (research/product/ecosystem/startup/events), entities, scores (novelty, impact, relevance, authority — each 0.0-1.0)",
        "3. Batch-create articles via `POST /api/companies/{companyId}/agents/{agentId}/news/articles/batch`",
        "4. Select top 10-12 articles balanced across categories, generate a markdown briefing grouped by lane",
        "5. Post briefing via `POST /api/companies/{companyId}/agents/{agentId}/news/briefings`",
        "6. Comment summary on this issue and mark done",
      ].join("\n"),
      status: "todo",
    });
  };

  useEffect(() => {
    setBreadcrumbs([{ label: "News" }]);
  }, [setBreadcrumbs]);

  const { data: briefings, isLoading: briefingsLoading } = useQuery({
    queryKey: queryKeys.news.briefings(selectedCompanyId!),
    queryFn: () => newsApi.listBriefings(selectedCompanyId!, {
      agentId: agentFilter !== "all" ? agentFilter : undefined,
    }),
    enabled: !!selectedCompanyId,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: [...queryKeys.news.articles(selectedCompanyId!), categoryFilter, agentFilter],
    queryFn: () => newsApi.listArticles(selectedCompanyId!, {
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      agentId: agentFilter !== "all" ? agentFilter : undefined,
    }),
    enabled: !!selectedCompanyId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);

  // Agents that have contributed news
  const newsAgentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of articles ?? []) ids.add(a.agentId);
    for (const b of briefings ?? []) ids.add(b.agentId);
    return ids;
  }, [articles, briefings]);

  if (!selectedCompanyId) {
    return <EmptyState icon={Newspaper} message="Select a company to view news." />;
  }

  const isLoading = view === "briefings" ? briefingsLoading : articlesLoading;
  if (isLoading) return <PageSkeleton variant="list" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="briefings">Briefings</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCollectNews}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New News
          </Button>
          {newsAgentIds.size > 0 && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {[...newsAgentIds].map((id) => {
                  const a = agentMap.get(id);
                  return (
                    <SelectItem key={id} value={id}>{a?.name ?? id.slice(0, 8)}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {view === "articles" && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="ecosystem">Ecosystem</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="events">Events</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {view === "briefings" && (
        <>
          {briefings && briefings.length === 0 && (
            <EmptyState icon={Newspaper} message="No briefings yet. Click + New News to assign an agent." />
          )}
          {briefings && briefings.length > 0 && (
            <div className="grid gap-2">
              {briefings.map((b) => (
                <BriefingCard key={b.id} briefing={b} agentMap={agentMap} />
              ))}
            </div>
          )}
        </>
      )}

      {view === "articles" && (
        <>
          {articles && articles.length === 0 && (
            <EmptyState icon={Newspaper} message="No news articles yet." />
          )}
          {articles && articles.length > 0 && (
            <div className="border border-border divide-y divide-border">
              {articles.map((a) => (
                <ArticleRow key={a.id} article={a} agentMap={agentMap} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
