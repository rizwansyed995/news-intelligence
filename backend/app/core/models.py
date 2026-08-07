from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Article(BaseModel):
    title: str
    url: str
    date: Optional[str] = "N/A"
    author: Optional[str] = "Unknown"
    category: Optional[str] = "General"
    summary: Optional[str] = ""
    key_points: List[str] = Field(default_factory=list)
    source: str = "CNBC"

class Enrichment(BaseModel):
    ai_summary: str
    insight_headline: str
    sentiment: str # Positive, Neutral, Negative
    sentiment_score: float # -1.0 to 1.0

class AnalyzedArticle(Article, Enrichment):
    heuristic_sentiment: Optional[str] = "Neutral"
    heuristic_score: Optional[float] = 0.0
    sentiment_divergence: bool = False
    impact_chain: List[str] = Field(default_factory=list)

class ChatRequest(BaseModel):
    query: str       # The user's typed question
    suite_id: str    # ID of the generated suite (uuid)
    search_query: str # The original topic (needed to hit the cache primary key)

class ChatResponse(BaseModel):
    answer: str
    citations: List[str]
    fallback_used: bool = False

class AnalysisSuite(BaseModel):
    id: str
    topic: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    articles: List[AnalyzedArticle]
    total_articles: int
    dominant_sentiment: str
    top_keywords: List[str]
    executive_summary: str
    market_conclusion: str
    master_impact_chain: List[str] = Field(default_factory=list)
    user_context: Optional[str] = None
