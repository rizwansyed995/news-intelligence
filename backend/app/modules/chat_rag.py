import os
import logging
from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from ..core.cache import cache_instance
from ..services.scraper_bridge import ScraperBridge

logger = logging.getLogger(__name__)

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0.2
)

# ── Primary RAG Prompt (strict, suite-only) ──────────────────────
prompt = PromptTemplate.from_template(
    """You are Nexus AI, an elite financial and geopolitical intelligence assistant.
Your goal is to answer the user's operational question using ONLY the provided Source Documents from the current intelligence suite.

Rules:
1. ONLY use information embedded in the Source Documents below.
2. If the documents do not contain the answer, respond with EXACTLY: "NEXUS_FALLBACK_TRIGGER" — nothing else.
3. ALWAYS cite the specific source of your claims using bracketed source names (e.g., "[CNBC]").

Source Documents:
{context}

User's Question: {query}

Analytical Answer:"""
)

# ── Fallback Prompt (web-grounded, clearly labeled) ──────────────
fallback_prompt = PromptTemplate.from_template(
    """You are Nexus AI. The user asked a question that was NOT covered by the current intelligence suite.
You have been given LIVE WEB SEARCH RESULTS to answer their question.

Rules:
1. Answer using ONLY the live search results below.
2. Be concise and analytical.
3. Cite sources where possible.

Live Search Results:
{context}

User's Question: {query}

Answer:"""
)

rag_chain = prompt | llm | StrOutputParser()
fallback_chain = fallback_prompt | llm | StrOutputParser()

# Shared scraper for fallback web searches
_fallback_scraper = ScraperBridge()

FALLBACK_TRIGGER = "NEXUS_FALLBACK_TRIGGER"


async def handle_rag_chat(query: str, search_query: str, suite_id: str) -> Dict[str, Any]:
    """Retrieves cached suite, converts articles to Documents, and runs LangChain RAG.
    If the answer is not in the suite, falls back to a live web search."""
    cached_articles = cache_instance.get_articles(search_query)
    
    if not cached_articles:
        return {
            "answer": f"Intelligence suite for '{search_query}' has expired from cache. Please re-run the analysis to chat with this data.",
            "citations": [],
            "fallback_used": False
        }
    
    # Convert Article dicts to LangChain Documents
    documents = []
    citations_set = set()
    articles = cached_articles
    
    for i, a in enumerate(articles):
        title = a.get("title", f"Article {i+1}")
        source = a.get("source", "Unknown")
        summary = a.get("summary", "")
        doc_content = f"Title: {title}\nSource: {source}\nContent: {summary}"
        documents.append(Document(page_content=doc_content, metadata={"source": source, "title": title}))
        citations_set.add(f"[{source}] {title}")

    if not documents:
        return {
            "answer": "No articles found in this suite.",
            "citations": [],
            "fallback_used": False
        }

    try:
        # ── STEP 1: Try strict RAG from cached suite ─────────
        answer = await rag_chain.ainvoke({
            "context": documents,
            "query": query
        })
        
        answer = answer.strip()
        
        # ── STEP 2: Check if fallback is needed ──────────────
        if FALLBACK_TRIGGER in answer:
            logger.info(f"RAG fallback triggered for query: '{query}'. Running live web search...")
            return await _run_fallback(query)
        
        return {
            "answer": answer,
            "citations": list(citations_set),
            "fallback_used": False
        }
    except Exception as e:
        logger.error(f"LangChain RAG failed: {e}")
        return {
            "answer": "My LangChain analysis engine encountered an error generating the response.",
            "citations": [],
            "fallback_used": False
        }


async def _run_fallback(query: str) -> Dict[str, Any]:
    """Performs a lightweight live web search and answers from the results."""
    try:
        # Scrape a small batch of articles using existing infrastructure
        live_articles = await _fallback_scraper.fetch_all(query, batch_size_per_source=3)
        
        if not live_articles:
            return {
                "answer": "I couldn't find this in the intelligence suite or via live search. Try rephrasing your question.",
                "citations": [],
                "fallback_used": True
            }
        
        # Build context from live results
        live_docs = []
        for i, a in enumerate(live_articles):
            doc_content = f"Title: {a.title}\nSource: {a.source}\nContent: {a.summary}"
            live_docs.append(Document(page_content=doc_content, metadata={"source": a.source}))
        
        # Run the fallback chain
        answer = await fallback_chain.ainvoke({
            "context": live_docs,
            "query": query
        })
        
        return {
            "answer": answer.strip(),
            "citations": [],
            "fallback_used": True
        }
    except Exception as e:
        logger.error(f"Fallback web search failed: {e}")
        return {
            "answer": "I couldn't find this in the current suite, and the live search encountered an error.",
            "citations": [],
            "fallback_used": True
        }
