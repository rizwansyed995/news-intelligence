import asyncio
import uuid
import logging
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    SCRAPING = "scraping"
    ENRICHING = "enriching"
    ANALYZING = "analyzing"
    COMPLETE = "complete"
    FAILED = "failed"


class TaskResult:
    """Stores the state and result of an async analysis task."""
    def __init__(self, task_id: str, query: str):
        self.task_id = task_id
        self.query = query
        self.status = TaskStatus.PENDING
        self.progress_message = "Task queued..."
        self.result: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None
        self.created_at = datetime.now().isoformat()
        self.completed_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "query": self.query,
            "status": self.status.value,
            "progress": self.progress_message,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }


class TaskQueue:
    """
    In-memory async task queue for Nexus analysis jobs.
    
    Uses asyncio.create_task() to run analyses in the background.
    Tasks are tracked by UUID and can be polled for status/results.
    
    For production, swap this with TaskIQ + Redis by changing the 
    submit() method to enqueue to Redis instead of asyncio.
    """
    
    def __init__(self):
        self._tasks: Dict[str, TaskResult] = {}
        self._max_tasks = 100  # Prevent unbounded memory growth
        logger.info("TaskQueue: Initialized (in-memory async broker).")
    
    def submit(self, query: str, batch_size: int, run_fn, user_context: str = None) -> str:
        """
        Submits an analysis job to run in the background.
        Returns a task_id immediately.
        
        Args:
            query: Search query
            batch_size: Number of articles to fetch
            run_fn: The async function to execute (Orchestrator.run_analysis)
            user_context: Optional user context for context-focused synthesis
        """
        # Cleanup old tasks if we're at capacity
        if len(self._tasks) >= self._max_tasks:
            self._cleanup_old_tasks()
        
        task_id = str(uuid.uuid4())[:8]  # Short IDs for readability
        task = TaskResult(task_id, query)
        self._tasks[task_id] = task
        
        # Fire and forget — runs in the background
        asyncio.create_task(self._execute(task, query, batch_size, run_fn, user_context))
        
        logger.info(f"TaskQueue: Submitted task {task_id} for '{query}'" + (f" (context: {user_context[:50]}...)" if user_context else ""))
        return task_id
    
    async def _execute(self, task: TaskResult, query: str, batch_size: int, run_fn, user_context: str = None):
        """Runs the analysis and updates the task state throughout."""
        try:
            task.status = TaskStatus.ANALYZING
            task.progress_message = f"Analyzing '{query}'..."
            
            # Run the actual analysis (with optional user context for Phase 10)
            result = await run_fn(query, batch_size, user_context=user_context)
            
            # Store the result
            task.result = result.model_dump()
            task.status = TaskStatus.COMPLETE
            task.progress_message = f"Complete. {result.total_articles} articles analyzed."
            task.completed_at = datetime.now().isoformat()
            
            logger.info(f"TaskQueue: Task {task.task_id} completed. {result.total_articles} articles.")
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.progress_message = f"Failed: {e}"
            task.completed_at = datetime.now().isoformat()
            logger.error(f"TaskQueue: Task {task.task_id} failed: {e}")
    
    def get_task(self, task_id: str) -> Optional[TaskResult]:
        """Returns the task state, or None if not found."""
        return self._tasks.get(task_id)
    
    def _cleanup_old_tasks(self):
        """Remove completed/failed tasks when at capacity."""
        removable = [
            tid for tid, t in self._tasks.items()
            if t.status in (TaskStatus.COMPLETE, TaskStatus.FAILED)
        ]
        for tid in removable[:self._max_tasks // 2]:
            del self._tasks[tid]
        logger.info(f"TaskQueue: Cleaned up {len(removable)} old tasks.")


# Global singleton
task_queue = TaskQueue()
