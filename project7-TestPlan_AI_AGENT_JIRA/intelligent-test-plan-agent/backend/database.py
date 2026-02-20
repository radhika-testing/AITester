"""Database configuration and models."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String, DateTime, Text, Integer, JSON
from datetime import datetime
import os

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/app.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class SettingsModel(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow)


class TemplateModel(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True)
    name = Column(String)
    content = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class HistoryModel(Base):
    __tablename__ = "history"
    
    id = Column(String, primary_key=True)
    ticket_id = Column(String)
    ticket_summary = Column(String)
    test_plan = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)
    provider_used = Column(String)


class RecentTicketModel(Base):
    __tablename__ = "recent_tickets"
    
    ticket_id = Column(String, primary_key=True)
    summary = Column(String)
    fetched_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    """Initialize the database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Get database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
