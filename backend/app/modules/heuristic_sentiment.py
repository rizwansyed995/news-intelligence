import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict, Any

logger = logging.getLogger(__name__)

class HeuristicAnalyzer:
    """
    Lexicon-based sentiment analyzer using VADER.
    Runs locally with zero API calls and completes in <1ms per article.
    
    Used as a "sanity check" against LLM-derived sentiment:
    - If VADER and Groq AGREE → high confidence
    - If they DISAGREE → "Sentiment Divergence" flag
    """
    
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        
        # ── PHASE 7: Financial Lexicon Expansion ──────────────────────────
        # VADER's default lexicon is trained on social media / general text.
        # Financial prose like "earnings plunge 20%" scores Neutral without these.
        # We inject domain-specific weights so the Divergence badge is accurate.
        financial_lexicon = {
            # Bearish / Negative terms
            "shortage": -2.0,
            "volatile": -1.5,
            "volatility": -1.5,
            "war": -3.5,
            "conflict": -2.5,
            "plunge": -3.0,
            "plunged": -3.0,
            "slump": -2.5,
            "tanked": -3.0,
            "crash": -4.0,
            "tariff": -2.0,
            "tariffs": -2.0,
            "sanction": -2.5,
            "sanctions": -2.5,
            "strike": -2.0,
            "bottleneck": -1.8,
            "layoff": -2.5,
            "layoffs": -2.5,
            "lawsuit": -2.0,
            "downgrade": -2.5,
            "downgraded": -2.5,
            "default": -3.5,
            "defaults": -3.0,
            "inflation": -1.5,
            "recession": -3.0,
            "drop": -1.5,
            "dropped": -1.5,
            "fell": -1.5,
            "sink": -2.0,
            "sank": -2.0,
            "uncertainty": -1.2,
            "deficit": -1.8,
            "debt": -1.0,
            "overvalued": -1.5,
            "downturn": -2.5,
            # Bullish / Positive terms
            "surge": 3.0,
            "surged": 3.0,
            "boom": 3.0,
            "breakthrough": 3.5,
            "acquire": 2.5,
            "acquisition": 2.5,
            "upgrade": 2.5,
            "upgraded": 2.5,
            "bullish": 3.0,
            "growth": 2.0,
            "expansion": 2.0,
            "profit": 2.0,
            "profitable": 2.0,
            "earnings": 1.0,
            "beat": 2.0,
            "beats": 2.0,
            "recovery": 2.5,
            "recovering": 2.0,
            "deal": 1.5,
            "partnership": 2.0,
            "innovate": 2.5,
            "innovation": 2.5,
            "breakout": 3.0,
            "gain": 2.0,
            "gains": 2.0,
            "soar": 3.0,
            "soared": 3.0,
            "merger": 1.5,
            "rally": 2.5,
            "rallied": 2.5,
            "outperform": 2.5,
            "blowout": 2.5,
        }
        
        self.analyzer.lexicon.update(financial_lexicon)
        logger.info(f"HeuristicAnalyzer: VADER initialized with {len(financial_lexicon)} financial terms.")

    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Runs VADER on a text string.
        Returns sentiment label and compound score.
        """
        if not text or len(text.strip()) < 5:
            return {"sentiment": "Neutral", "compound": 0.0}
        
        scores = self.analyzer.polarity_scores(text)
        compound = scores["compound"]
        
        # VADER thresholds (standard)
        if compound >= 0.05:
            sentiment = "Positive"
        elif compound <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
        
        return {
            "sentiment": sentiment,
            "compound": round(compound, 4)
        }

    def check_divergence(self, ai_sentiment: str, text: str) -> Dict[str, Any]:
        """
        Compares AI-derived sentiment with VADER's lexicon-based analysis.
        Returns the heuristic result and whether there is a divergence.
        """
        heuristic = self.analyze(text)
        
        ai_norm = ai_sentiment.capitalize().strip()
        vader_norm = heuristic["sentiment"]
        
        # Divergence = AI and VADER disagree on the direction
        divergence = (ai_norm != vader_norm) and (ai_norm != "Neutral" and vader_norm != "Neutral")
        
        return {
            "heuristic_sentiment": vader_norm,
            "heuristic_score": heuristic["compound"],
            "sentiment_divergence": divergence
        }


# Global singleton
heuristic_analyzer = HeuristicAnalyzer()
