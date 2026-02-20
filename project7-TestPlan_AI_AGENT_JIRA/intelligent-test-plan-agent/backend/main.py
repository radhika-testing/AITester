"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import init_db, async_session_maker
from routes import settings, jira, templates, testplan
from routes.settings import load_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    
    # Load settings
    async with async_session_maker() as db:
        await load_settings(db)
    
    yield
    
    # Shutdown
    pass


app = FastAPI(
    title="Intelligent Test Plan Generator API",
    description="AI-powered test plan generation from JIRA tickets",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(settings.router)
app.include_router(jira.router)
app.include_router(templates.router)
app.include_router(testplan.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Intelligent Test Plan Generator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
