import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Fallback to local SQLite if Postgres URL is not provided
# This ensures it runs immediately for the user locally while being Cloud-ready
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///nexus_cloud.db")

# Create Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for debugging SQL queries
    future=True,
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    """Dependency for dependency injection in FastAPI routers"""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    """Create all tables on startup"""
    async with engine.begin() as conn:
        # Avoid dropping tables in production, this is just to ensure schema is built
        await conn.run_sync(Base.metadata.create_all)
