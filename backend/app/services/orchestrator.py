import asyncio
import uuid
import logging
from typing import List
from ..core.models import Article, AnalyzedArticle, AnalysisSuite
from ..services.scraper_bridge import ScraperBridge
from ..modules.intelligence import StrategicAIEngine
from ..core.cache import cache_instance
from ..core.vector_store import vector_store
from ..modules.heuristic_sentiment import heuristic_analyzer
from ..modules.impact_agent import generate_impact_chain

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self):
        self.scraper_bridge = ScraperBridge()
        self.enricher = StrategicAIEngine()

    async def run_analysis(self, query: str, batch_size: int, user_context: str = None) -> AnalysisSuite:
        # TIER 1 CACHE: Check for RAW SCRAPED articles to skip the slow web crawler (60 min TTL)
        cached_articles_data = cache_instance.get_articles(query)

        if cached_articles_data:
            logger.info(f"SCRAPE CACHE HIT for query: {query}. Skipping web crawling.")
            raw_articles = [Article(**data) for data in cached_articles_data]
        else:
            # 1. Fetch Articles from Multiple Sources
            logger.info(f"Scraping fresh articles for: {query}")
            raw_articles = await self.scraper_bridge.fetch_all(query, batch_size)
            if raw_articles:
                cache_instance.save_articles(query, [a.model_dump() for a in raw_articles])

        if not raw_articles:
            return self._empty_suite(query)

        # PHASE 2: Retrieve historical context from vector DB
        historical_context = vector_store.query_similar(query, n_results=5)

        # Helper to normalize sentiment for the UI
        def normalize_sentiment(val: str) -> str:
            val = str(val).capitalize().strip()
            return val if val in ["Positive", "Neutral", "Negative"] else "Neutral"

        analyzed_articles = []
        
        # 2. Unified Mega-Analysis (Single API Call for all items)
        try:
            # We want the AI to synthesize the WHOLE story freshly every time
            analysis_data = await self.enricher.analyze_all(raw_articles, historical_context=historical_context, user_context=user_context)
            
            ai_article_results = analysis_data.get("articles", [])
            
            for i, article in enumerate(raw_articles):
                if i < len(ai_article_results):
                    ai_info = ai_article_results[i]
                    summary = ai_info.get("ai_summary") or ai_info.get("summary") or "Analysis Pending..."
                    headline = ai_info.get("insight_headline") or ai_info.get("headline") or "Market Alert"
                else:
                    summary = "Analysis Pending..."
                    headline = "Recent Alert"
                    ai_info = {"sentiment": "Neutral", "score": 0.0}

                analyzed_articles.append(AnalyzedArticle(
                    **article.model_dump(),
                    ai_summary=summary,
                    insight_headline=headline,
                    sentiment=normalize_sentiment(ai_info.get("sentiment", "Neutral")),
                    sentiment_score=float(ai_info.get("score", 0.0))
                ))
            
            executive_summary = analysis_data.get("executive_summary") or "Synthesis Flow Interrupted."
            market_conclusion = analysis_data.get("market_conclusion") or "Verification required."
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            
            # Fallback
            for article in raw_articles:
                analyzed_articles.append(AnalyzedArticle(
                    **article.model_dump(),
                    ai_summary="Strategic analysis synthesis in progress.",
                    insight_headline="Intelligence Alert",
                    sentiment="Neutral",
                    sentiment_score=0.0
                ))
            
            executive_summary = "Analysis flow interrupted."
            market_conclusion = "Please verify system credentials."

        # 4. Calculate Aggregate Metrics
        dominant_sentiment = self._calculate_dominant_sentiment(analyzed_articles)
        top_keywords = self._extract_keywords(analyzed_articles)

        # PHASE 5: Autonomously generate Impact Chains via LangGraph Agent
        logger.info(f"Running LangGraph Impact Agent for {len(analyzed_articles)} articles...")
        impact_tasks = [generate_impact_chain(a.ai_summary) for a in analyzed_articles]
        impact_chains = await asyncio.gather(*impact_tasks, return_exceptions=True)

        # PHASE 3 & 5: Combine VADER sentiment and LangGraph Impact Chains
        for i, article in enumerate(analyzed_articles):
            # Safe unpack Impact Chain
            chain = impact_chains[i]
            if isinstance(chain, Exception):
                logger.error(f"Impact Agent Failed for article {i}: {chain}")
                chain = []
            
            # VADER heuristic divergence check
            text = f"{article.title}. {article.ai_summary}"
            vader_result = heuristic_analyzer.check_divergence(article.sentiment, text)
            
            # Create a dictionary of updates
            updates = {
                "heuristic_sentiment": vader_result.get("heuristic_sentiment"),
                "heuristic_score": vader_result.get("heuristic_score"),
                "sentiment_divergence": vader_result.get("sentiment_divergence"),
                "impact_chain": list(chain) if chain else []
            }
            
            analyzed_articles[i] = article.model_copy(update=updates)

        # Helper: Determine if we have valid outputs
        suite_fallback_phrases = ["unavailable", "interrupted", "pending", "verify", "maintenance"]
        has_real_briefing = not any(p in executive_summary.lower() for p in suite_fallback_phrases)

        # PHASE 8: Master Impact Chain — aggregates individual chains into one macro chain
        master_chain = []
        if has_real_briefing:
            logger.info("Generating Master Macro Impact Chain...")
            master_chain = await self.enricher.generate_master_impact(
                [a.impact_chain for a in analyzed_articles]
            )

        final_suite = AnalysisSuite(
            id=str(uuid.uuid4()),
            topic=query,
            articles=analyzed_articles,
            total_articles=len(analyzed_articles),
            dominant_sentiment=dominant_sentiment,
            top_keywords=top_keywords,
            executive_summary=executive_summary,
            market_conclusion=market_conclusion,
            master_impact_chain=master_chain,
            user_context=user_context
        )
        
        # PHASE 2: Store analyzed articles in vector DB for future retrieval
        if has_real_briefing:
            article_dicts = [a.model_dump() for a in analyzed_articles]
            vector_store.store_articles(article_dicts, query)
        
        return final_suite

    def _calculate_dominant_sentiment(self, articles: List[AnalyzedArticle]) -> str:
        if not articles: return "Neutral"
        counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for a in articles:
            # Re-normalize just in case cache had different casing
            sent = str(a.sentiment).capitalize().strip()
            if sent not in counts: sent = "Neutral"
            counts[sent] += 1
        return max(counts, key=counts.get)

    def _extract_keywords(self, articles: List[AnalyzedArticle]) -> List[str]:
        # Simple extraction for now, basically what the visualizer did
        # In a real app we'd use something more sophisticated
        from collections import Counter
        import re
        
        all_text = " ".join([a.title for a in articles]).lower()
        words = re.findall(r'\b\w{4,}\b', all_text) # words > 3 chars
        stop_words = {'with', 'from', 'this', 'that', 'they', 'have', 'were', 'been'}
        filtered = [w for w in words if w not in stop_words]
        return [word for word, count in Counter(filtered).most_common(5)]

    def _empty_suite(self, query: str) -> AnalysisSuite:
        return AnalysisSuite(
            id=str(uuid.uuid4()),
            topic=query,
            articles=[],
            total_articles=0,
            dominant_sentiment="Neutral",
            top_keywords=[],
            executive_summary="No articles found for this topic.",
            market_conclusion="No analysis possible."
        )
