import logging
import asyncio
from typing import List
from datetime import datetime, timedelta
from ..modules.cnbc import CNBCScraper
from ..modules.googlenews import GoogleNewsScraper
from ..modules.playwright_scraper import enrich_articles_with_full_text
from ..core.models import Article

logger = logging.getLogger(__name__)

# Max article age in days
MAX_ARTICLE_AGE_DAYS = 7

def _is_recent(date_str: str, max_age_days: int = MAX_ARTICLE_AGE_DAYS) -> bool:
    """Check if an article date is within the allowed age window."""
    if not date_str or date_str == "N/A":
        return True  # Keep articles with unknown dates (benefit of the doubt)
    
    try:
        # Handle multiple date formats
        cutoff = datetime.now() - timedelta(days=max_age_days)
        
        # Try ISO format first (CNBC: "2025-03-10T14:30:00Z")
        for fmt in [
            "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%d",
            "%a, %d %b %Y %H:%M:%S %Z",   # Google News RFC 2822
            "%a, %d %b %Y %H:%M:%S GMT",
        ]:
            try:
                parsed = datetime.strptime(date_str.strip(), fmt)
                # Remove timezone info for comparison
                parsed = parsed.replace(tzinfo=None)
                return parsed >= cutoff
            except ValueError:
                continue
        
        # If no format matched, keep the article
        return True
    except Exception:
        return True  # Keep on any error


class ScraperBridge:
    """
    A multi-source gateway that merges news flows from multiple scrapers.
    After merging, articles are filtered for recency, then enriched via Crawl4AI.
    """
    def __init__(self):
        self.scrapers = [
            CNBCScraper(),
            GoogleNewsScraper()
        ]

    async def fetch_all(self, query: str, batch_size_per_source: int = 10) -> List[Article]:
        """Runs all scrapers in parallel, merges, deduplicates, filters by date, then enriches."""
        tasks = [scraper.fetch(query, batch_size_per_source) for scraper in self.scrapers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        merged_articles = []
        seen_urls = set()
        source_counts = {}

        for i, res in enumerate(results):
            source_name = self.scrapers[i].__class__.__name__
            if isinstance(res, Exception):
                logger.error(f"Scraper {source_name} failed: {res}")
                continue
            
            source_counts[source_name] = len(res)
            for article in res:
                if article.url not in seen_urls:
                    merged_articles.append(article)
                    seen_urls.add(article.url)

        logger.info(f"SOURCES: {source_counts}")
        logger.info(f"DEDUPLICATED: {len(merged_articles)} articles total.")

        # DATE FILTER: Drop articles older than 7 days
        recent_articles = [a for a in merged_articles if _is_recent(a.date)]
        dropped = len(merged_articles) - len(recent_articles)
        if dropped > 0:
            logger.info(f"DATE FILTER: Dropped {dropped} old articles. {len(recent_articles)} remain.")

        # Cap to 12 before enrichment (to limit browser overhead)
        capped = recent_articles[:12]

        # PHASE 1: Enrich articles with full-text via Crawl4AI/Playwright
        try:
            enriched = await enrich_articles_with_full_text(capped, max_concurrent=3)
            return enriched
        except Exception as e:
            logger.error(f"Crawl4AI enrichment failed, returning raw articles: {e}")
            return capped

