"""Template API routes."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, TemplateModel
from services.pdf_parser import parse_template
from models import TemplateInfo
from typing import List
from datetime import datetime
import uuid
import os

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.post("/upload")
async def upload_template(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a PDF template."""
    # Validate file
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size (5MB limit)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    try:
        # Parse PDF
        template_content = parse_template(content)
        
        # Save to database
        template_id = str(uuid.uuid4())
        db.add(TemplateModel(
            id=template_id,
            name=file.filename,
            content=template_content
        ))
        await db.commit()
        
        return {
            "status": "success",
            "template_id": template_id,
            "name": file.filename,
            "preview": template_content[:500] + "..." if len(template_content) > 500 else template_content
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")


@router.get("/")
async def list_templates(db: AsyncSession = Depends(get_db)):
    """List all uploaded templates."""
    result = await db.execute(select(TemplateModel).order_by(TemplateModel.uploaded_at.desc()))
    templates = result.scalars().all()
    
    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "uploaded_at": t.uploaded_at,
                "preview": t.content[:200] + "..." if len(t.content) > 200 else t.content
            }
            for t in templates
        ]
    }


@router.get("/{template_id}")
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific template."""
    result = await db.execute(
        select(TemplateModel).where(TemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "id": template.id,
        "name": template.name,
        "content": template.content,
        "uploaded_at": template.uploaded_at
    }


@router.delete("/{template_id}")
async def delete_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a template."""
    result = await db.execute(
        select(TemplateModel).where(TemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(template)
    await db.commit()
    
    return {"status": "success", "message": "Template deleted"}
