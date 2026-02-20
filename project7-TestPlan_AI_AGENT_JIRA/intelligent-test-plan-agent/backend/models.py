"""Pydantic models for the application."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class LLMProvider(str, Enum):
    GROQ = "groq"
    OLLAMA = "ollama"


class JiraConfig(BaseModel):
    base_url: str
    username: str
    api_token: str


class LLMConfig(BaseModel):
    provider: LLMProvider
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = "llama-3.3-70b-versatile"
    ollama_base_url: Optional[str] = "http://localhost:11434"
    ollama_model: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)


class TemplateInfo(BaseModel):
    id: str
    name: str
    uploaded_at: datetime
    content: str


class JiraIssue(BaseModel):
    key: str
    summary: str
    description: str
    issue_type: str
    priority: str
    status: str
    assignee: Optional[str] = None
    labels: List[str] = []
    components: List[str] = []
    acceptance_criteria: Optional[str] = None
    attachments: List[Dict[str, Any]] = []


class TestCase(BaseModel):
    id: str
    title: str
    description: str
    preconditions: List[str]
    steps: List[str]
    expected_results: List[str]
    priority: str
    test_type: str


class RiskItem(BaseModel):
    description: str
    impact: str
    mitigation: str


class TestSchedule(BaseModel):
    phase: str
    duration: str
    activities: List[str]


class ResourceRequirement(BaseModel):
    type: str
    description: str
    quantity: Optional[str] = None


class TestPlanSection(BaseModel):
    """A section within the test plan."""
    heading: str
    content: str


class ComprehensiveTestPlan(BaseModel):
    """A comprehensive test plan with all standard sections."""
    title: str
    source_issue: str
    generated_at: datetime
    
    # Test Plan Sections
    executive_summary: str
    scope_objectives: str
    test_strategy: str
    test_environment: str
    entry_criteria: List[str]
    exit_criteria: List[str]
    risks_mitigations: List[RiskItem]
    test_schedule: List[TestSchedule]
    resource_requirements: List[ResourceRequirement]
    
    # Test Cases
    test_cases: List[TestCase]
    
    # Metadata
    metadata: Dict[str, Any]


class TestPlan(BaseModel):
    """Legacy test plan model for backward compatibility."""
    title: str
    source_issue: str
    generated_at: datetime
    test_cases: List[TestCase]
    metadata: Dict[str, Any]


class GenerateRequest(BaseModel):
    ticket_id: str
    template_id: Optional[str] = None
    provider: LLMProvider = LLMProvider.GROQ
    comprehensive: bool = True  # Whether to generate comprehensive test plan


class GenerationProgress(BaseModel):
    stage: str
    message: str
    progress: int = Field(ge=0, le=100)


class ExportFormat(str, Enum):
    MARKDOWN = "markdown"
    PDF = "pdf"
    JSON = "json"
