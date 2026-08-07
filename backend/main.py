import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
load_dotenv()

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router

from contextlib import asynccontextmanager
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    await init_db()
    yield

app = FastAPI(
    title="Nexus Intelligence API",
    description="Modular AI-powered news analysis engine.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
