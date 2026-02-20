"""JIRA API routes."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, delete
from database import get_db, RecentTicketModel
from services.jira_client import get_jira_client, JiraClient
from models import JiraIssue
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/jira", tags=["jira"])


@router.post("/fetch")
async def fetch_ticket(ticket_data: dict, db: AsyncSession = Depends(get_db)):
    """Fetch a JIRA ticket by ID."""
    ticket_id = ticket_data.get("ticketId")
    if not ticket_id:
        raise HTTPException(status_code=400, detail="ticketId is required")
    
    # Validate ticket ID format
    import re
    if not re.match(r"^[A-Z]+-\d+$", ticket_id):
        raise HTTPException(status_code=400, detail="Invalid ticket ID format. Expected format: PROJECT-123")
    
    # Get JIRA client
    client = get_jira_client()
    if not client:
        raise HTTPException(status_code=400, detail="JIRA not configured. Please configure JIRA settings first.")
    
    try:
        # Fetch issue
        issue = await client.get_issue(ticket_id)
        
        # Save to recent tickets
        result = await db.execute(
            select(RecentTicketModel).where(RecentTicketModel.ticket_id == ticket_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.fetched_at = datetime.utcnow()
        else:
            # Keep only last 5
            await db.execute(
                delete(RecentTicketModel).where(
                    RecentTicketModel.ticket_id.not_in(
                        select(RecentTicketModel.ticket_id)
                        .order_by(RecentTicketModel.fetched_at.desc())
                        .limit(4)
                    )
                )
            )
            db.add(RecentTicketModel(ticket_id=ticket_id, summary=issue.summary))
        
        await db.commit()
        
        return {"status": "success", "issue": issue.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch ticket: {str(e)}")


@router.get("/recent")
async def get_recent_tickets(db: AsyncSession = Depends(get_db)):
    """Get recently fetched tickets."""
    result = await db.execute(
        select(RecentTicketModel)
        .order_by(RecentTicketModel.fetched_at.desc())
        .limit(5)
    )
    tickets = result.scalars().all()
    
    return {
        "tickets": [
            {"ticket_id": t.ticket_id, "summary": t.summary, "fetched_at": t.fetched_at.isoformat() if t.fetched_at else None}
            for t in tickets
        ]
    }


from sqlalchemy import delete
