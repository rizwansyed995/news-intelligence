from sqlalchemy import Column, String, Text, DateTime, Float, JSON
from datetime import datetime
from .database import Base
import uuid

class ArticleCache(Base):
    """
    Stores RAW scraped articles.
    This replaces the old 'suite_cache' which inappropriately cached the final AI logic.
    """
    __tablename__ = "article_cache_v2"

    query = Column(String, primary_key=True, index=True)
    articles_data = Column(JSON, nullable=False) # Stores the list of Article dicts
    timestamp = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    """
    SaaS Feature: Stores a log of past searches so the user can review them in a sidebar.
    """
    __tablename__ = "search_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String, index=True, nullable=False)
    executive_summary = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
