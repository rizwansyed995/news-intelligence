import httpx
import logging
from typing import List
from ..core.interfaces import BaseScraper
from ..core.models import Article

logger = logging.getLogger(__name__)

class CNBCScraper(BaseScraper):
    """
    CNBC metadata scraper. Uses the Queryly search API to fetch article metadata.
    Full-text content extraction is handled downstream by the Crawl4AI pipeline.
    """
    def __init__(self):
        self.api_url = "https://api.queryly.com/cnbc/json.aspx"
        self.queryly_key = "31a35d40a9a64ab3"

    async def fetch(self, query: str, batch_size: int) -> List[Article]:
        params = {
            "queryly_key": self.queryly_key,
            "query": query,
            "endindex": "0",
            "batchsize": str(batch_size),
            "showfaceted": "false",
            "timezoneoffset": "-330"
        }

        async with httpx.AsyncClient() as client:
            try:
                logger.info(f"CNBC Scraper: Fetching metadata for '{query}' (target: {batch_size})")
                response = await client.get(self.api_url, params=params)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                
                articles = []
                for item in results:
                    article_url = item.get("cn:liveURL")
                    if not article_url:
                        continue
                    
                    articles.append(Article(
                        title=item.get("cn:title", "No Title"),
                        url=article_url,
                        date=item.get("datePublished", "N/A"),
                        author=item.get("author", "Unknown"),
                        category=item.get("section", "General"),
                        summary=item.get("description", ""),
                        source="CNBC"
                    ))
                
                logger.info(f"CNBC Scraper: Found {len(articles)} results.")
                return articles
            except Exception as e:
                logger.error(f"CNBC Scraper failed: {e}")
                return []
