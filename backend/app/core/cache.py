import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

DB_PATH = "nexus_cache.db"

class NexusCache:
    def __init__(self):
        self._init_db()

    def _init_db(self):
        """Initializes the SQLite database schema."""
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Article Enrichment Cache (Long-lived)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS article_cache (
                    url TEXT PRIMARY KEY,
                    summary TEXT,
                    headline TEXT,
                    sentiment TEXT,
                    score REAL,
                    timestamp DATETIME
                )
            """)
            
            # Full Suite Search Cache (Short-lived)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS suite_cache (
                    query TEXT PRIMARY KEY,
                    data TEXT,
                    timestamp DATETIME
                )
            """)
            conn.commit()

    def get_article(self, url: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached AI enrichment for an article URL."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT summary, headline, sentiment, score FROM article_cache WHERE url = ?", (url,))
                row = cursor.fetchone()
                if row:
                    return {
                        "summary": row[0],
                        "headline": row[1],
                        "sentiment": row[2],
                        "score": row[3]
                    }
        except Exception as e:
            logger.error(f"Cache read error (article): {e}")
        return None

    def save_article(self, url: str, enrichment: Dict[str, Any]):
        """Persists AI enrichment to the article cache."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO article_cache (url, summary, headline, sentiment, score, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    url, 
                    enrichment.get("summary", ""), 
                    enrichment.get("headline", ""), 
                    enrichment.get("sentiment", "Neutral"), 
                    enrichment.get("score", 0.0),
                    datetime.now()
                ))
                conn.commit()
        except Exception as e:
            logger.error(f"Cache write error (article): {e}")

    def get_articles(self, query: str, ttl_minutes: int = 60) -> Optional[List[Dict[str, Any]]]:
        """Retrieves raw cached scraped articles for a query to skip the slow web crawling phase."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT data, timestamp FROM suite_cache WHERE query = ?", (query.lower(),))
                row = cursor.fetchone()
                if row:
                    data_json, timestamp_str = row
                    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")
                    if datetime.now() - timestamp < timedelta(minutes=ttl_minutes):
                        return json.loads(data_json)
        except Exception as e:
            logger.error(f"Cache read error (articles): {e}")
        return None

    def save_articles(self, query: str, articles_data: List[Dict[str, Any]]):
        """Persists RAW scraped articles to the query cache."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO suite_cache (query, data, timestamp)
                    VALUES (?, ?, ?)
                """, (query.lower(), json.dumps(articles_data), datetime.now()))
                conn.commit()
        except Exception as e:
            logger.error(f"Cache write error (articles): {e}")

# Global cache instance
cache_instance = NexusCache()
