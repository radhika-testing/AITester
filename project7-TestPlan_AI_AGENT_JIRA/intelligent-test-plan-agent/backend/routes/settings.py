"""Settings API routes."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db, SettingsModel
from models import JiraConfig, LLMConfig, LLMProvider
from services.jira_client import JiraClient, set_jira_client
from services.llm_providers import get_llm_provider, GroqProvider, OllamaProvider
import json
import os

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.post("/jira")
async def save_jira_config(config: JiraConfig, db: AsyncSession = Depends(get_db)):
    """Save JIRA configuration."""
    try:
        # Test connection first
        client = JiraClient(config.base_url, config.username, config.api_token)
        await client.test_connection()
        
        # Save to database (encrypted)
        settings = {
            "base_url": config.base_url,
            "username": config.username,
            "api_token": config.api_token
        }
        
        # Upsert
        result = await db.execute(select(SettingsModel).where(SettingsModel.key == "jira_config"))
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.value = json.dumps(settings)
        else:
            db.add(SettingsModel(key="jira_config", value=json.dumps(settings)))
        
        await db.commit()
        
        # Set global client
        set_jira_client(client)
        
        return {"status": "success", "message": "JIRA configuration saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save JIRA config: {str(e)}")


@router.get("/jira")
async def get_jira_status(db: AsyncSession = Depends(get_db)):
    """Get JIRA connection status."""
    try:
        result = await db.execute(select(SettingsModel).where(SettingsModel.key == "jira_config"))
        config = result.scalar_one_or_none()
        
        if not config:
            return {"configured": False, "message": "JIRA not configured"}
        
        # Test connection
        settings = json.loads(config.value)
        client = JiraClient(settings["base_url"], settings["username"], settings["api_token"])
        user_info = await client.test_connection()
        
        return {
            "configured": True,
            "connected": True,
            "user": user_info.get("displayName"),
            "base_url": settings["base_url"]
        }
    except Exception as e:
        return {"configured": True, "connected": False, "error": str(e)}


@router.post("/llm")
async def save_llm_config(config: LLMConfig, db: AsyncSession = Depends(get_db)):
    """Save LLM configuration."""
    try:
        settings = {
            "provider": config.provider,
            "groq_api_key": config.groq_api_key,
            "groq_model": config.groq_model,
            "ollama_base_url": config.ollama_base_url,
            "ollama_model": config.ollama_model,
            "temperature": config.temperature
        }
        
        # Upsert
        result = await db.execute(select(SettingsModel).where(SettingsModel.key == "llm_config"))
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.value = json.dumps(settings)
        else:
            db.add(SettingsModel(key="llm_config", value=json.dumps(settings)))
        
        await db.commit()
        
        return {"status": "success", "message": "LLM configuration saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save LLM config: {str(e)}")


@router.get("/llm")
async def get_llm_status(db: AsyncSession = Depends(get_db)):
    """Get LLM configuration status."""
    try:
        result = await db.execute(select(SettingsModel).where(SettingsModel.key == "llm_config"))
        config = result.scalar_one_or_none()
        
        if not config:
            return {"configured": False, "message": "LLM not configured"}
        
        settings = json.loads(config.value)
        return {
            "configured": True,
            "provider": settings.get("provider"),
            "groq_model": settings.get("groq_model"),
            "ollama_model": settings.get("ollama_model"),
            "temperature": settings.get("temperature", 0.7)
        }
    except Exception as e:
        return {"configured": False, "error": str(e)}


@router.post("/llm/test")
async def test_llm_connection(config: LLMConfig):
    """Test LLM provider connection."""
    try:
        provider = get_llm_provider(config)
        success = await provider.test_connection()
        
        if success:
            return {"status": "success", "message": f"{config.provider.value} connection successful"}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to connect to {config.provider.value}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/llm/models")
async def list_ollama_models(base_url: str = "http://localhost:11434"):
    """List available Ollama models."""
    try:
        provider = OllamaProvider(base_url=base_url)
        models = await provider.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch Ollama models: {str(e)}")


async def load_settings(db: AsyncSession):
    """Load settings on startup."""
    # Load JIRA config
    result = await db.execute(select(SettingsModel).where(SettingsModel.key == "jira_config"))
    jira_config = result.scalar_one_or_none()
    
    if jira_config:
        settings = json.loads(jira_config.value)
        client = JiraClient(settings["base_url"], settings["username"], settings["api_token"])
        set_jira_client(client)
