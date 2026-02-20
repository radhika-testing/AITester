"""Test Plan generation API routes."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, HistoryModel, TemplateModel
from services.jira_client import get_jira_client
from services.llm_providers import get_llm_provider
from models import GenerateRequest, LLMConfig, LLMProvider, ExportFormat
from typing import Optional
from datetime import datetime
import uuid
import json
import markdown

router = APIRouter(prefix="/api/testplan", tags=["testplan"])


@router.post("/generate")
async def generate_test_plan(
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate a comprehensive test plan for a JIRA ticket."""
    
    # Get JIRA client
    jira_client = get_jira_client()
    if not jira_client:
        raise HTTPException(status_code=400, detail="JIRA not configured")
    
    # Fetch ticket
    try:
        issue = await jira_client.get_issue(request.ticket_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch ticket: {str(e)}")
    
    # Get template content if specified
    template_content = None
    if request.template_id:
        result = await db.execute(
            select(TemplateModel).where(TemplateModel.id == request.template_id)
        )
        template = result.scalar_one_or_none()
        if template:
            template_content = template.content
    
    # Get LLM config
    result = await db.execute(select(HistoryModel).limit(1))  # Dummy query
    
    # Load LLM settings
    from database import SettingsModel
    result = await db.execute(
        select(SettingsModel).where(SettingsModel.key == "llm_config")
    )
    llm_settings = result.scalar_one_or_none()
    
    if not llm_settings:
        raise HTTPException(status_code=400, detail="LLM not configured")
    
    settings = json.loads(llm_settings.value)
    
    # Override provider if specified
    provider_type = request.provider
    
    config = LLMConfig(
        provider=provider_type,
        groq_api_key=settings.get("groq_api_key"),
        groq_model=settings.get("groq_model"),
        ollama_base_url=settings.get("ollama_base_url"),
        ollama_model=settings.get("ollama_model"),
        temperature=settings.get("temperature", 0.7)
    )
    
    # Generate test plan
    try:
        provider = get_llm_provider(config)
        comprehensive_plan = await provider.generate_test_plan(
            issue, 
            template_content,
            comprehensive=request.comprehensive
        )
        
        # Save to history
        history_id = str(uuid.uuid4())
        # Convert to dict and handle datetime serialization
        test_plan_dict = comprehensive_plan.dict()
        test_plan_dict["generated_at"] = test_plan_dict["generated_at"].isoformat()
        db.add(HistoryModel(
            id=history_id,
            ticket_id=issue.key,
            ticket_summary=issue.summary,
            test_plan=json.dumps(test_plan_dict),
            provider_used=provider_type.value
        ))
        await db.commit()
        
        return {
            "status": "success",
            "test_plan": test_plan_dict,
            "history_id": history_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate test plan: {str(e)}")


@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    """Get generation history."""
    result = await db.execute(
        select(HistoryModel).order_by(HistoryModel.generated_at.desc()).limit(50)
    )
    history = result.scalars().all()
    
    return {
        "history": [
            {
                "id": h.id,
                "ticket_id": h.ticket_id,
                "ticket_summary": h.ticket_summary,
                "generated_at": h.generated_at.isoformat() if h.generated_at else None,
                "provider_used": h.provider_used
            }
            for h in history
        ]
    }


@router.get("/history/{history_id}")
async def get_history_item(history_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific history item."""
    result = await db.execute(
        select(HistoryModel).where(HistoryModel.id == history_id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    return {
        "id": item.id,
        "ticket_id": item.ticket_id,
        "ticket_summary": item.ticket_summary,
        "test_plan": json.loads(item.test_plan),
        "generated_at": item.generated_at.isoformat() if item.generated_at else None,
        "provider_used": item.provider_used
    }


@router.post("/export/{history_id}")
async def export_test_plan(
    history_id: str,
    export_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Export test plan in various formats."""
    format_type = export_data.get("format", "markdown")
    
    # Get history item
    result = await db.execute(
        select(HistoryModel).where(HistoryModel.id == history_id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    test_plan = json.loads(item.test_plan)
    
    if format_type == "markdown":
        content = _convert_to_markdown(test_plan)
        return {"content": content, "format": "markdown", "filename": f"{test_plan['source_issue']}_test_plan.md"}
    
    elif format_type == "json":
        return {"content": json.dumps(test_plan, indent=2), "format": "json", "filename": f"{test_plan['source_issue']}_test_plan.json"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format_type}")


def _convert_to_markdown(test_plan: dict) -> str:
    """Convert comprehensive test plan to markdown format."""
    md = f"# {test_plan['title']}\n\n"
    md += f"**Source:** {test_plan['source_issue']}\n\n"
    generated_at = test_plan.get('generated_at', 'N/A')
    md += f"**Generated:** {generated_at}\n\n"
    md += f"**Total Test Cases:** {test_plan['metadata'].get('total_tests', 0)}\n\n"
    
    # Check if it's a comprehensive test plan
    is_comprehensive = test_plan.get('executive_summary') is not None
    
    if is_comprehensive:
        md += "---\n\n"
        
        # Executive Summary
        md += "## Executive Summary\n\n"
        md += f"{test_plan.get('executive_summary', 'N/A')}\n\n"
        
        # Scope & Objectives
        md += "## Scope & Objectives\n\n"
        md += f"{test_plan.get('scope_objectives', 'N/A')}\n\n"
        
        # Test Strategy
        md += "## Test Strategy\n\n"
        md += f"{test_plan.get('test_strategy', 'N/A')}\n\n"
        
        # Test Environment
        md += "## Test Environment\n\n"
        md += f"{test_plan.get('test_environment', 'N/A')}\n\n"
        
        # Entry Criteria
        md += "## Entry Criteria\n\n"
        entry_criteria = test_plan.get('entry_criteria', [])
        if entry_criteria:
            for criteria in entry_criteria:
                md += f"- {criteria}\n"
        else:
            md += "- No specific entry criteria defined\n"
        md += "\n"
        
        # Exit Criteria
        md += "## Exit Criteria\n\n"
        exit_criteria = test_plan.get('exit_criteria', [])
        if exit_criteria:
            for criteria in exit_criteria:
                md += f"- {criteria}\n"
        else:
            md += "- No specific exit criteria defined\n"
        md += "\n"
        
        # Risks & Mitigations
        md += "## Risks & Mitigations\n\n"
        risks = test_plan.get('risks_mitigations', [])
        if risks:
            md += "| Risk | Impact | Mitigation |\n"
            md += "|------|--------|------------|\n"
            for risk in risks:
                md += f"| {risk.get('description', 'N/A')} | {risk.get('impact', 'N/A')} | {risk.get('mitigation', 'N/A')} |\n"
        else:
            md += "No risks identified\n"
        md += "\n"
        
        # Test Schedule
        md += "## Test Schedule\n\n"
        schedule = test_plan.get('test_schedule', [])
        if schedule:
            for phase in schedule:
                md += f"### {phase.get('phase', 'Phase')}\n\n"
                md += f"**Duration:** {phase.get('duration', 'N/A')}\n\n"
                activities = phase.get('activities', [])
                if activities:
                    md += "**Activities:**\n"
                    for activity in activities:
                        md += f"- {activity}\n"
                md += "\n"
        else:
            md += "No schedule defined\n\n"
        
        # Resource Requirements
        md += "## Resource Requirements\n\n"
        resources = test_plan.get('resource_requirements', [])
        if resources:
            md += "| Type | Description | Quantity |\n"
            md += "|------|-------------|----------|\n"
            for resource in resources:
                md += f"| {resource.get('type', 'N/A')} | {resource.get('description', 'N/A')} | {resource.get('quantity', 'N/A')} |\n"
        else:
            md += "No resources defined\n"
        md += "\n"
        
        # Test Cases Section
        md += "---\n\n"
        md += "# Test Cases\n\n"
    else:
        md += "---\n\n"
    
    # Test Cases
    for tc in test_plan.get('test_cases', []):
        md += f"## {tc['id']}: {tc['title']}\n\n"
        md += f"**Type:** {tc['test_type']} | **Priority:** {tc['priority']}\n\n"
        md += f"**Description:** {tc['description']}\n\n"
        
        if tc.get('preconditions'):
            md += "### Preconditions\n"
            for pre in tc['preconditions']:
                md += f"- {pre}\n"
            md += "\n"
        
        if tc.get('steps'):
            md += "### Steps\n"
            for i, step in enumerate(tc['steps'], 1):
                md += f"{i}. {step}\n"
            md += "\n"
        
        if tc.get('expected_results'):
            md += "### Expected Results\n"
            for er in tc['expected_results']:
                md += f"- {er}\n"
            md += "\n"
        
        md += "---\n\n"
    
    return md
