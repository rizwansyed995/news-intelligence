from abc import ABC, abstractmethod
from typing import List
from .models import Article, Enrichment

class BaseScraper(ABC):
    @abstractmethod
    async def fetch(self, query: str, batch_size: int) -> List[Article]:
        """Fetch raw articles based on a query."""
        pass

class BaseEnricher(ABC):
    @abstractmethod
    async def enrich(self, article: Article) -> Enrichment:
        """Enrich a single article with AI-generated insights."""
        pass

    @abstractmethod
    async def generate_suite_insights(self, articles: List[Article]) -> dict:
        """Generate high-level suite-wide insights (summary, conclusion)."""
        pass

    @abstractmethod
    async def analyze_all(self, articles: List[Article]) -> dict:
        """Unified analysis: Summarize and synthesize multiple articles in one Go."""
        pass
