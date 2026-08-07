import asyncio
import logging
from typing import List, Optional
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from ..core.models import Article

logger = logging.getLogger(__name__)

# Module-level crawler instance (reused across requests for performance)
_crawler_instance: Optional[AsyncWebCrawler] = None
_crawler_lock = asyncio.Lock()

async def get_crawler() -> AsyncWebCrawler:
    """Lazy-init a shared AsyncWebCrawler to avoid spinning up a browser per request."""
    global _crawler_instance
    async with _crawler_lock:
        if _crawler_instance is None:
            browser_conf = BrowserConfig(
                headless=True,
                verbose=False
            )
            _crawler_instance = AsyncWebCrawler(config=browser_conf)
            await _crawler_instance.__aenter__()
            logger.info("Crawl4AI: Browser instance initialized.")
        return _crawler_instance


async def extract_full_text(url: str) -> str:
    """
    Uses Crawl4AI to render a page in headless Chromium and extract
    the full article text as clean Markdown.
    Returns the first 2000 chars of the article content.
    Hard timeout: 8 seconds per page.
    """
    try:
        crawler = await get_crawler()
        run_conf = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            page_timeout=8000,  # 8s per page
            wait_until="domcontentloaded"
        )
        result = await asyncio.wait_for(
            crawler.arun(url=url, config=run_conf),
            timeout=10  # Hard kill at 10s
        )
        
        if result.success and result.markdown:
            text = result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown)
            clean_text = text.strip()[:2000]
            logger.info(f"Crawl4AI: Extracted {len(clean_text)} chars from {url[:50]}")
            return clean_text
        else:
            return ""
    except asyncio.TimeoutError:
        logger.warning(f"Crawl4AI: Timeout for {url[:50]}")
        return ""
    except Exception as e:
        logger.error(f"Crawl4AI: Failed for {url[:50]}: {e}")
        return ""


async def _do_enrichment(articles: List[Article], max_concurrent: int = 3) -> List[Article]:
    """Internal enrichment with per-article extraction."""
    tasks = []
    indices_to_enrich = []
    
    for i, article in enumerate(articles):
        current_summary = article.summary or ""
        if len(current_summary) < 200:
            tasks.append(extract_full_text(article.url))
            indices_to_enrich.append(i)
        if len(tasks) >= max_concurrent:
            break
    
    if not tasks:
        logger.info("Crawl4AI: All articles have sufficient content. Skipping.")
        return articles
    
    logger.info(f"Crawl4AI: Enriching {len(tasks)} articles...")
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    enriched = list(articles)
    upgraded = 0
    for idx, result in zip(indices_to_enrich, results):
        if isinstance(result, Exception) or not result:
            continue
        if len(result) > len(enriched[idx].summary or ""):
            enriched[idx] = enriched[idx].model_copy(update={"summary": result})
            upgraded += 1
    
    logger.info(f"Crawl4AI: {upgraded}/{len(tasks)} articles upgraded with full text.")
    return enriched


async def enrich_articles_with_full_text(articles: List[Article], max_concurrent: int = 3) -> List[Article]:
    """
    Enriches articles with full text, but with a HARD 20-second overall timeout.
    If enrichment takes too long, returns original articles as-is.
    """
    try:
        return await asyncio.wait_for(
            _do_enrichment(articles, max_concurrent),
            timeout=20  # Hard 20s cap on the entire enrichment step
        )
    except asyncio.TimeoutError:
        logger.warning("Crawl4AI: Overall enrichment timed out (20s). Returning raw articles.")
        return articles
    except Exception as e:
        logger.error(f"Crawl4AI: Enrichment error: {e}. Returning raw articles.")
        return articles

