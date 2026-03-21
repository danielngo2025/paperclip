export interface NewsArticle {
  id: string;
  companyId: string;
  agentId: string;
  source: string;
  url: string;
  title: string;
  summary: string | null;
  category: string;
  entities: string[];
  lane: string | null;
  author: string | null;
  noveltyScore: number | null;
  impactScore: number | null;
  relevanceScore: number | null;
  authorityScore: number | null;
  compositeScore: number | null;
  publishedAt: string | null;
  collectedAt: string;
  createdAt: string;
}

export interface NewsBriefing {
  id: string;
  companyId: string;
  agentId: string;
  date: string;
  markdownContent: string;
  totalCollected: number;
  totalSelected: number;
  topics: string[];
  generatedAt: string;
  createdAt: string;
}
