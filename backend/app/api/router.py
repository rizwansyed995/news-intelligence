from fastapi import APIRouter, HTTPException
from ..services.orchestrator import Orchestrator
from ..core.models import AnalysisSuite, ChatRequest, ChatResponse
from ..core.tasks import task_queue
from ..core.vector_store import vector_store
from ..modules.chat_rag import handle_rag_chat
from ..modules.context_preprocessor import context_preprocessor

router = APIRouter()
orchestrator = Orchestrator()

# ── SYNC ENDPOINT (backward-compatible) ──────────────────────────
@router.get("/analyze", response_model=AnalysisSuite)
async def analyze_topic(q: str, limit: int = 10):
    """Original sync endpoint — blocks until analysis is complete."""
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    try:
        suite = await orchestrator.run_analysis(q, limit)
        return suite
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── ASYNC ENDPOINTS (Phase 4 + Phase 10 Context Routing) ─────────
@router.get("/analyze/async")
async def analyze_topic_async(q: str, limit: int = 10):
    """
    PHASE 10: Context-Aware Analysis.
    Accepts natural language queries like "How does AI regulation affect NVDA?"
    Pre-processes to extract search terms, then focuses synthesis on user's context.
    """
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    # PHASE 10: Decompose user input into search terms + context
    decomposed = await context_preprocessor.decompose(q)
    search_query = decomposed["search_query"]
    user_context = decomposed["user_context"]
    
    task_id = task_queue.submit(search_query, limit, orchestrator.run_analysis, user_context=user_context)
    return {
        "task_id": task_id, 
        "status": "pending", 
        "poll_url": f"/api/task/{task_id}",
        "search_query": search_query,
        "is_contextual": decomposed["is_contextual"]
    }

@router.get("/task/{task_id}")
async def get_task_result(task_id: str):
    """Returns the full task state including results when complete."""
    task = task_queue.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task.to_dict()

@router.get("/task/{task_id}/status")
async def get_task_status(task_id: str):
    """Lightweight status check — no result payload."""
    task = task_queue.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {
        "task_id": task.task_id,
        "status": task.status.value,
        "progress": task.progress_message
    }

# ── RAG CHAT ENDPOINT (Phase 5) ────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat_with_suite(request: ChatRequest):
    """Answers user questions using LangChain RAG over the current suite cache."""
    try:
        response = await handle_rag_chat(
            query=request.query,
            search_query=request.search_query,
            suite_id=request.suite_id
        )
        return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── HEALTH ────────────────────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vector_store": vector_store.get_stats()
    }
