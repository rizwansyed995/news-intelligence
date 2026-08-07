import httpx
import logging
from bs4 import BeautifulSoup
from typing import List
from ..core.interfaces import BaseScraper
from ..core.models import Article

logger = logging.getLogger(__name__)

class GoogleNewsScraper(BaseScraper):
    """
    A broad news scraper that pulls from across the web using Google News RSS.
    Highly reliable, no blocking, and provides diverse sources.
    """
    def __init__(self):
        self.base_url = "https://news.google.com/rss/search"

    async def fetch(self, query: str, batch_size: int = 10) -> List[Article]:
        """Fetches news results using GNews RSS."""
        articles = []
        params = {
            "q": query + " when:7d", # last 7 days
            "hl": "en-US",
            "gl": "US",
            "ceid": "US:en"
        }

        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                logger.info(f"Google News Scraper initiating fetch for '{query}'...")
                response = await client.get(self.base_url, params=params, timeout=15)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "xml") # RSS is XML
                items = soup.find_all("item", limit=batch_size)

                for item in items:
                    title = item.title.get_text() if item.title else "No Title"
                    url = item.link.get_text() if item.link else ""
                    pub_date = item.pubDate.get_text() if item.pubDate else "N/A"
                    source_elem = item.find("source")
                    source_name = source_elem.get_text() if source_elem else "Global News"
                    
                    articles.append(Article(
                        title=title,
                        url=url,
                        summary="", # RSS snippets are often just HTML junk or missing
                        source=source_name,
                        category="Broad Market",
                        date=pub_date
                    ))
                
                logger.info(f"Google News Scraper complete. Found {len(articles)} global results.")
                return articles
            except Exception as e:
                logger.error(f"Google News Scraper failed: {e}")
                return []
