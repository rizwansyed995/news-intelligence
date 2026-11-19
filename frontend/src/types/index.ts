export interface Article {
  title: string;
  url: string;
  source: string;
  category: string;
  date?: string;
  sentiment: "Positive" | "Neutral" | "Negative" | string;
  heuristic_sentiment?: "Positive" | "Neutral" | "Negative" | string;
  sentiment_divergence?: boolean;
  ai_summary?: string;
  insight_headline?: string;
  impact_chain?: string[];
  [key: string]: unknown;
}

export interface AnalysisSuite {
  id: string;
  topic: string;
  total_articles: number;
  dominant_sentiment: string;
  articles: Article[];
  executive_summary: string;
  market_conclusion: string;
  master_impact_chain?: string[];
  top_keywords: string[];
  user_context?: string;
  [key: string]: unknown;
}

export interface SearchHistoryItem {
  topic: string;
  timestamp: string;
  articles: number;
}

export interface ChatMessage {
  role: "user" | "ai" | "error";
  content: string;
  citations?: unknown[];
  fallback?: boolean;
}
