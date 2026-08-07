"""
PHASE 10: Context-Based Agentic Routing

Pre-processes natural language user queries to:
1. Extract discrete search terms for the scraper
2. Preserve the original user context for focused synthesis
3. Determine if a query is a raw keyword or context-rich question

Examples:
  "Semiconductors"                    → search="Semiconductors", context=None
  "How does AI regulation hit NVDA?"  → search="AI regulation NVIDIA", context="How does AI regulation hit NVDA stock?"
"""

import os
import json
import logging
import asyncio
from groq import Groq
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

logger = logging.getLogger(__name__)


class ContextPreprocessor:
    """
    Uses Groq LLM to decompose context-rich user input into
    a clean search query + preserved user context.
    """

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None
        self.model = "llama-3.3-70b-versatile"

    async def decompose(self, user_input: str) -> dict:
        """
        Takes raw user input and returns:
        {
            "search_query": "clean keywords for scraper",
            "user_context": "original question for synthesis focus" or None,
            "is_contextual": True/False
        }
        """
        # Fast path: if input is clearly just keywords (1-3 words, no question marks)
        word_count = len(user_input.strip().split())
        has_question = any(c in user_input for c in ['?', 'how', 'what', 'why', 'will', 'affect', 'impact', 'portfolio', 'investment'])

        if word_count <= 3 and not has_question:
            logger.info(f"ContextPreprocessor: Keyword mode — '{user_input}'")
            return {
                "search_query": user_input.strip(),
                "user_context": None,
                "is_contextual": False
            }

        # Context-rich query — use LLM to extract search terms
        if not self.client:
            logger.warning("ContextPreprocessor: No Groq client, falling back to raw query")
            return {
                "search_query": user_input.strip(),
                "user_context": user_input.strip(),
                "is_contextual": True
            }

        prompt = f"""A user typed this into a financial news intelligence platform:

"{user_input}"

Extract:
1. "search_query": 2-5 keywords that a news scraper should search for (no stock tickers, use full company names). These should be broad enough to find relevant articles.
2. "user_context": The user's original question rephrased as a clear analytical directive (1 sentence). If the input is just keywords, set to null.
3. "is_contextual": true if the user asked a question or provided context, false if they just typed keywords.

RETURN ONLY VALID JSON."""

        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": "You extract search intents from user queries. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)

            # Ensure search_query is a string (LLM sometimes returns a list of keywords)
            sq = data.get("search_query", user_input.strip())
            if isinstance(sq, list):
                sq = " ".join(str(s) for s in sq)
            sq = str(sq).strip()

            result = {
                "search_query": sq,
                "user_context": data.get("user_context"),
                "is_contextual": data.get("is_contextual", True)
            }

            logger.info(f"ContextPreprocessor: '{user_input}' → search='{result['search_query']}', contextual={result['is_contextual']}")
            return result

        except Exception as e:
            logger.warning(f"ContextPreprocessor failed: {e}, using raw query")
            return {
                "search_query": user_input.strip(),
                "user_context": user_input.strip(),
                "is_contextual": True
            }


# Global singleton
context_preprocessor = ContextPreprocessor()
