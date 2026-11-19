import os
import json
import logging
import asyncio
from groq import Groq
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from ..core.interfaces import BaseEnricher
from ..core.models import Article, Enrichment

dotenv_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

logger = logging.getLogger(__name__)

class StrategicAIEngine(BaseEnricher):
    """
    A lightning-fast AI intelligence engine using Groq's custom hardware.
    Switches from Gemini to Llama-3 on Groq for higher rate limits and <1s latency.
    """
    
    def __init__(self, model_name: str = "openai/gpt-oss-120b"):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model_name = model_name
        
        if not self.api_key:
            logger.error(f"CRITICAL: GROQ_API_KEY is missing (checked {dotenv_path})")
            self.client = None
            return

        self.client = Groq(api_key=self.api_key)
        logger.info(f"Strategic Intelligence Engine: GROQ Client Live using {model_name}")

    async def enrich(self, article: Article) -> Enrichment:
        """Enriches a single article with analyst-grade insights using Groq."""
        if not self.client:
            return self._get_fallback_enrichment()

        context = f"TITLE: {article.title}\nCONTENT: {article.summary[:1000]}"
        prompt = f"Senior Analyst Insight Required. Return JSON: {context}"
        
        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Return ONLY JSON: {'summary': '...', 'headline': '...', 'sentiment': '...', 'score': 0.0}"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            
            return Enrichment(
                ai_summary=data.get("summary", "Analysis Pending..."),
                insight_headline=data.get("headline", "Market Alert"),
                sentiment=self._validate_sentiment(data.get("sentiment", "Neutral")),
                sentiment_score=self._clamp_score(data.get("score", 0.0))
            )
        except Exception as e:
            logger.warning(f"Groq Enrichment failed: {e}")
            return self._get_fallback_enrichment()

    async def analyze_all(self, articles: List[Article], historical_context: list = None, user_context: str = None) -> dict:
        """
        THE MEGA-PROMPT STRATEGY (GROQ EDITION) — Now with RAG context + user context routing.
        """
        if not self.client or not articles:
            return self._generate_error_batch(articles)

        # Format stream for the AI
        stream_content = ""
        for i, a in enumerate(articles):
            stream_content += f"--- ARTICLE {i+1} ---\nTITLE: {a.title}\nCONTENT: {a.summary[:1500]}\n\n"

        # PHASE 2: Build historical intelligence context from vector DB
        history_section = ""
        if historical_context:
            history_section = "\n--- HISTORICAL INTELLIGENCE (from past analyses) ---\n"
            for h in historical_context[:5]:
                history_section += f"- [{h.get('source', 'N/A')}] {h.get('title', 'N/A')} | Sentiment: {h.get('sentiment', 'N/A')} | Previously searched under: \"{h.get('original_query', 'N/A')}\"\n"
            history_section += "\nUse this historical context to identify trend shifts or pattern continuations.\n"

        # PHASE 10: Context-Aware Focus Directive
        context_directive = ""
        if user_context:
            context_directive = f"""
--- USER ANALYTICAL CONTEXT ---
The user's specific question/concern: "{user_context}"
IMPORTANT: Focus your executive summary and market conclusion EXCLUSIVELY on answering this question.
Frame all insights through the lens of this specific concern.
"""

        prompt = f"""Evaluate this news stream.
{stream_content}
{history_section}
{context_directive}
TASKS:
1. For EVERY article, provide a summary (2 sentences), insight headline (6 words), sentiment (Positive/Neutral/Negative), and score (-1.0 to 1.0).
2. Synthesis: 3 takeaways and a market conclusion as HTML lists.{' Compare with historical patterns if context is available.' if historical_context else ''}{' Focus synthesis on user context.' if user_context else ''}

RETURN ONLY VALID JSON. 
{{
  "articles": [{{"summary": "...", "headline": "...", "sentiment": "...", "score": 0.0}}],
  "executive_summary": "<ul>...</ul>",
  "market_conclusion": "<ul>...</ul>"
}}"""

        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a Chief Intelligence Analyst. Output strictly valid JSON objects."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            
            # Map back to our internal model keys
            processed_articles = []
            ai_results = data.get("articles", [])
            for i in range(len(articles)):
                if i < len(ai_results):
                    res = ai_results[i]
                    processed_articles.append({
                        "ai_summary": res.get("summary") or "Strategic analysis in progress.",
                        "insight_headline": res.get("headline") or "Intelligence Update",
                        "sentiment": self._validate_sentiment(res.get("sentiment", "Neutral")),
                        "sentiment_score": self._clamp_score(res.get("score", 0.0))
                    })
                else:
                    processed_articles.append(self._get_fallback_enrichment().dict())

            return {
                "articles": processed_articles,
                "executive_summary": data.get("executive_summary") or self._get_fallback_suite()["executive_summary"],
                "market_conclusion": data.get("market_conclusion") or self._get_fallback_suite()["market_conclusion"]
            }
        except Exception as e:
            logger.error(f"Groq Mega-Analysis failed: {e}")
            return self._generate_error_batch(articles)

    async def generate_suite_insights(self, articles: List[Article], historical_context: list = None) -> dict:
        """Synthesizes multiple articles using Groq, optionally with historical vector DB context."""
        if not self.client or not articles:
            return self._get_fallback_suite()

        headlines = "\n".join([f"- {a.title}" for a in articles[:10]])
        
        history_section = ""
        if historical_context:
            history_section = "\n\nHISTORICAL CONTEXT (from past analyses):\n"
            for h in historical_context[:5]:
                history_section += f"- [{h.get('source', 'N/A')}] {h.get('title', 'N/A')} | Sentiment: {h.get('sentiment', 'N/A')}\n"
            history_section += "\nCompare current trends with this historical data."
        
        prompt = f"Synthesize these news flows into an executive briefing JSON: {headlines}{history_section}"

        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Return JSON with: executive_summary (HTML <ul>) and market_conclusion (HTML <ul>)"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.warning(f"Groq Suite Synthesis failed: {e}")
            return self._get_fallback_suite()

    async def generate_master_impact(self, individual_chains: List[List[str]]) -> List[str]:
        """
        PHASE 8: Aggregates per-article impact chains into ONE macro-level chain.
        Individual chains remain untouched — this is an additional synthesis.
        """
        if not self.client or not individual_chains:
            return []
        
        # Only use chains that have all 3 parts (Event, Effect, Risk)
        valid_chains = [c for c in individual_chains if len(c) == 3]
        if not valid_chains:
            return []

        chains_text = "\n".join([f"- {c[0]} → {c[1]} → {c[2]}" for c in valid_chains])

        prompt = f"""Below are micro-level impact chains from individual news articles:
{chains_text}

Synthesize these into ONE Master Macro Impact Chain that captures the overall strategic picture.
Return JSON: {{"master_chain": ["MACRO EVENT (max 8 words)", "BROAD EFFECT (max 8 words)", "SYSTEMIC RISK (max 8 words)"]}}
RETURN ONLY JSON."""

        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a Macro Strategy Consultant. Return JSON with 'master_chain' as a list of exactly 3 strings."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            chain = data.get("master_chain", [])
            return chain if len(chain) == 3 else []
        except Exception as e:
            logger.warning(f"Master Impact synthesis failed: {e}")
            return []

    def _generate_error_batch(self, articles):
        return {
            "articles": [self._get_fallback_enrichment().dict() for _ in articles],
            "executive_summary": self._get_fallback_suite()["executive_summary"],
            "market_conclusion": self._get_fallback_suite()["market_conclusion"]
        }

    def _validate_sentiment(self, sentiment: str) -> str:
        valid = {"Positive", "Neutral", "Negative"}
        s = str(sentiment).capitalize()
        return s if s in valid else "Neutral"

    def _clamp_score(self, score) -> float:
        try:
            return max(-1.0, min(1.0, float(score)))
        except:
            return 0.0

    def _get_fallback_enrichment(self) -> Enrichment:
        return Enrichment(
            ai_summary="Strategic analysis system currently syncing data.",
            insight_headline="System Sync Active",
            sentiment="Neutral",
            sentiment_score=0.0
        )

    def _get_fallback_suite(self) -> dict:
        return {
            "executive_summary": "<ul><li>Real-time intelligence pipeline is re-balancing.</li><li>Cached data will be served where available.</li></ul>",
            "market_conclusion": "<ul><li>Intelligence synthesis pending server allocation.</li></ul>"
        }
