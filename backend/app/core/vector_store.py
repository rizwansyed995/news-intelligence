import logging
import chromadb
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Persistent ChromaDB storage path (relative to backend root)
CHROMA_DB_PATH = "./nexus_vector_db"

class NexusVectorStore:
    """
    A persistent vector store for Nexus Intelligence articles.
    Uses ChromaDB with its built-in embedding model (all-MiniLM-L6-v2)
    for semantic search across historical article data.
    """
    
    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
            self.collection = self.client.get_or_create_collection(
                name="nexus_articles",
                metadata={"hnsw:space": "cosine"}  # cosine similarity for text
            )
            logger.info(f"VectorStore: Initialized. Collection has {self.collection.count()} documents.")
        except Exception as e:
            logger.error(f"VectorStore: Failed to initialize ChromaDB: {e}")
            self.client = None
            self.collection = None

    def store_articles(self, articles: List[Dict[str, Any]], query: str) -> None:
        """
        Stores analyzed articles in the vector store.
        Each article is embedded using its title + summary for semantic matching.
        """
        if not self.collection:
            return
        
        try:
            ids = []
            documents = []
            metadatas = []
            
            for article in articles:
                # Use URL as unique ID (prevents duplicates naturally)
                article_id = str(hash(article.get("url", "")))
                
                # Build the text to embed: title + summary gives the best semantic signal
                title = article.get("title", "")
                summary = article.get("ai_summary", "") or article.get("summary", "")
                embed_text = f"{title}. {summary}"
                
                if not embed_text.strip() or len(embed_text) < 10:
                    continue
                
                ids.append(article_id)
                documents.append(embed_text[:1000])  # Cap embedding input
                metadatas.append({
                    "title": title[:200],
                    "url": article.get("url", ""),
                    "source": article.get("source", "Unknown"),
                    "sentiment": article.get("sentiment", "Neutral"),
                    "query": query,
                    "headline": article.get("insight_headline", "")[:200]
                })
            
            if ids:
                self.collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info(f"VectorStore: Stored {len(ids)} articles for query '{query}'. Total docs: {self.collection.count()}")
        except Exception as e:
            logger.error(f"VectorStore: Failed to store articles: {e}")

    def query_similar(self, text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves the most semantically similar historical articles.
        Returns a list of dicts with metadata and relevance score.
        """
        if not self.collection or self.collection.count() == 0:
            return []
        
        try:
            results = self.collection.query(
                query_texts=[text],
                n_results=min(n_results, self.collection.count())
            )
            
            similar_articles = []
            if results and results["metadatas"]:
                for i, metadata in enumerate(results["metadatas"][0]):
                    distance = results["distances"][0][i] if results["distances"] else 0
                    similar_articles.append({
                        "title": metadata.get("title", ""),
                        "source": metadata.get("source", ""),
                        "sentiment": metadata.get("sentiment", ""),
                        "headline": metadata.get("headline", ""),
                        "original_query": metadata.get("query", ""),
                        "relevance": round(1 - distance, 3)  # Convert distance to similarity
                    })
            
            logger.info(f"VectorStore: Found {len(similar_articles)} similar articles for context.")
            return similar_articles
        except Exception as e:
            logger.error(f"VectorStore: Query failed: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Returns basic stats about the vector store."""
        if not self.collection:
            return {"status": "offline", "total_documents": 0}
        return {
            "status": "online",
            "total_documents": self.collection.count()
        }


# Global singleton
vector_store = NexusVectorStore()
