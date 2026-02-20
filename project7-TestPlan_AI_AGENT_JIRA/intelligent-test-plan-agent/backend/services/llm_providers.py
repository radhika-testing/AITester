"""LLM provider services (Groq and Ollama)."""
import httpx
import json
import asyncio
from typing import AsyncGenerator, Optional, List, Dict, Any
from groq import Groq
from models import (
    LLMProvider, LLMConfig, JiraIssue, TestPlan, ComprehensiveTestPlan,
    TestCase, RiskItem, TestSchedule, ResourceRequirement
)
from datetime import datetime


class LLMProviderBase:
    """Base class for LLM providers."""
    
    async def generate_test_plan(
        self,
        issue: JiraIssue,
        template_content: Optional[str],
        comprehensive: bool = True,
        progress_callback: Optional[Any] = None
    ) -> ComprehensiveTestPlan:
        raise NotImplementedError
    
    async def test_connection(self) -> bool:
        raise NotImplementedError


class GroqProvider(LLMProviderBase):
    """Groq API provider."""
    
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile", temperature: float = 0.7):
        self.client = Groq(api_key=api_key)
        self.model = model
        self.temperature = temperature
    
    async def test_connection(self) -> bool:
        """Test Groq API connection."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            print(f"Groq connection test failed: {e}")
            return False
    
    async def generate_test_plan(
        self,
        issue: JiraIssue,
        template_content: Optional[str],
        comprehensive: bool = True,
        progress_callback: Optional[Any] = None
    ) -> ComprehensiveTestPlan:
        """Generate comprehensive test plan using Groq."""
        
        # Build the comprehensive prompt
        system_prompt = """You are an expert QA Engineer with years of experience in software testing. 
Generate a comprehensive, professional test plan document based on the provided JIRA ticket.

Your response must be valid JSON with the following comprehensive structure:

{
  "title": "Test Plan: [Feature Name]",
  "executive_summary": "Brief overview of the testing approach and objectives (2-3 paragraphs)",
  "scope_objectives": "Detailed description of what is in scope, out of scope, and test objectives",
  "test_strategy": "Overall testing approach, methodologies, and testing levels (unit, integration, system, UAT)",
  "test_environment": "Hardware, software, network, and tool requirements for testing",
  "entry_criteria": ["Condition 1", "Condition 2", "Condition 3"],
  "exit_criteria": ["Condition 1", "Condition 2", "Condition 3"],
  "risks_mitigations": [
    {
      "description": "Risk description",
      "impact": "High/Medium/Low",
      "mitigation": "How to mitigate this risk"
    }
  ],
  "test_schedule": [
    {
      "phase": "Phase name (e.g., Test Planning, Test Execution)",
      "duration": "Estimated duration (e.g., 3 days, 1 week)",
      "activities": ["Activity 1", "Activity 2"]
    }
  ],
  "resource_requirements": [
    {
      "type": "Human/Tool/Infrastructure",
      "description": "Detailed description",
      "quantity": "Number or description of quantity needed"
    }
  ],
  "test_cases": [
    {
      "id": "TC-001",
      "title": "Test case title",
      "description": "Detailed description of what this test validates",
      "preconditions": ["Precondition 1", "Precondition 2"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expected_results": ["Expected result 1", "Expected result 2"],
      "priority": "High/Medium/Low",
      "test_type": "Functional/Integration/UI/Performance/Security/Regression"
    }
  ]
}

Guidelines:
1. Create a PROFESSIONAL test plan document suitable for enterprise use
2. Include at least 8-15 detailed test cases covering:
   - Positive scenarios (happy path)
   - Negative scenarios (error handling)
   - Edge cases and boundary conditions
   - Security considerations
   - UI/UX validations (if applicable)
3. Each test case should have 3-8 clear steps
4. Risks should be realistic and relevant to the feature
5. Schedule should reflect realistic testing phases
6. Resources should include both human and tool requirements"""

        # Build context
        context = f"""
JIRA Ticket Details:
===================
Ticket Key: {issue.key}
Summary: {issue.summary}
Description: {issue.description}
Priority: {issue.priority}
Issue Type: {issue.issue_type}
Status: {issue.status}
Labels: {', '.join(issue.labels) if issue.labels else 'None'}
Components: {', '.join(issue.components) if issue.components else 'None'}
Assignee: {issue.assignee or 'Unassigned'}
"""
        
        if issue.acceptance_criteria:
            context += f"""
Acceptance Criteria:
===================
{issue.acceptance_criteria}
"""
        
        if template_content:
            context += f"""
Template Structure:
===================
{template_content}
"""
        
        user_prompt = f"""{context}

Based on the above JIRA ticket, generate a COMPREHENSIVE TEST PLAN document.

The test plan should include:
1. Executive Summary - Overview of testing approach
2. Scope & Objectives - What's being tested and goals
3. Test Strategy - Methodology and testing levels
4. Test Environment - Required setup
5. Entry & Exit Criteria - When to start/stop testing
6. Risks & Mitigations - Potential issues and solutions
7. Test Schedule - Timeline and phases
8. Resource Requirements - People and tools needed
9. Test Cases - Detailed test scenarios (8-15 test cases)

Generate a professional test plan that could be used in an enterprise environment."""
        
        # Call Groq API
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=8000,
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                data = json.loads(content)
                
                # Parse test cases
                test_cases = []
                for i, tc in enumerate(data.get("test_cases", [])):
                    test_cases.append(TestCase(
                        id=tc.get("id", f"TC-{i+1:03d}"),
                        title=tc.get("title", ""),
                        description=tc.get("description", ""),
                        preconditions=tc.get("preconditions", []),
                        steps=tc.get("steps", []),
                        expected_results=tc.get("expected_results", []),
                        priority=tc.get("priority", "Medium"),
                        test_type=tc.get("test_type", "Functional")
                    ))
                
                # Parse risks
                risks = []
                for risk in data.get("risks_mitigations", []):
                    risks.append(RiskItem(
                        description=risk.get("description", ""),
                        impact=risk.get("impact", "Medium"),
                        mitigation=risk.get("mitigation", "")
                    ))
                
                # Parse schedule
                schedule = []
                for phase in data.get("test_schedule", []):
                    schedule.append(TestSchedule(
                        phase=phase.get("phase", ""),
                        duration=phase.get("duration", ""),
                        activities=phase.get("activities", [])
                    ))
                
                # Parse resources
                resources = []
                for resource in data.get("resource_requirements", []):
                    resources.append(ResourceRequirement(
                        type=resource.get("type", ""),
                        description=resource.get("description", ""),
                        quantity=resource.get("quantity")
                    ))
                
                return ComprehensiveTestPlan(
                    title=data.get("title", f"Test Plan: {issue.summary}"),
                    source_issue=issue.key,
                    generated_at=datetime.utcnow(),
                    executive_summary=data.get("executive_summary", ""),
                    scope_objectives=data.get("scope_objectives", ""),
                    test_strategy=data.get("test_strategy", ""),
                    test_environment=data.get("test_environment", ""),
                    entry_criteria=data.get("entry_criteria", []),
                    exit_criteria=data.get("exit_criteria", []),
                    risks_mitigations=risks,
                    test_schedule=schedule,
                    resource_requirements=resources,
                    test_cases=test_cases,
                    metadata={
                        "provider": "groq",
                        "model": self.model,
                        "total_tests": len(test_cases),
                        "comprehensive": True
                    }
                )
                
            except Exception as e:
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to generate test plan after {max_retries} attempts: {e}")
                await asyncio.sleep(2 ** attempt)


class OllamaProvider(LLMProviderBase):
    """Ollama local LLM provider."""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.model = model
    
    async def test_connection(self) -> bool:
        """Test Ollama connection."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            print(f"Ollama connection test failed: {e}")
            return False
    
    async def list_models(self) -> List[str]:
        """List available Ollama models."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
    
    async def generate_test_plan(
        self,
        issue: JiraIssue,
        template_content: Optional[str],
        comprehensive: bool = True,
        progress_callback: Optional[Any] = None
    ) -> ComprehensiveTestPlan:
        """Generate comprehensive test plan using Ollama."""
        
        if not self.model:
            models = await self.list_models()
            if not models:
                raise Exception("No Ollama models available")
            self.model = models[0]
        
        # Build the prompt
        system_prompt = """You are an expert QA Engineer. Generate a comprehensive test plan based on the provided JIRA ticket.
Your response must be valid JSON with the following structure:

{
  "title": "Test Plan: ...",
  "executive_summary": "Brief overview",
  "scope_objectives": "Scope and objectives",
  "test_strategy": "Testing approach",
  "test_environment": "Environment requirements",
  "entry_criteria": ["Condition 1"],
  "exit_criteria": ["Condition 1"],
  "risks_mitigations": [{"description": "...", "impact": "High", "mitigation": "..."}],
  "test_schedule": [{"phase": "...", "duration": "...", "activities": ["..."]}],
  "resource_requirements": [{"type": "...", "description": "...", "quantity": "..."}],
  "test_cases": [{"id": "TC-001", "title": "...", "description": "...", "preconditions": [], "steps": [], "expected_results": [], "priority": "High", "test_type": "Functional"}]
}"""

        # Build context
        context = f"""
JIRA Ticket:
- Key: {issue.key}
- Summary: {issue.summary}
- Description: {issue.description}
- Priority: {issue.priority}
- Issue Type: {issue.issue_type}
"""
        
        if issue.acceptance_criteria:
            context += f"\nAcceptance Criteria:\n{issue.acceptance_criteria}\n"
        
        if template_content:
            context += f"\nTemplate Structure:\n{template_content}\n"
        
        user_prompt = f"{context}\n\nGenerate a comprehensive test plan with all sections and 8-15 detailed test cases."
        
        # Call Ollama API
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        f"{self.base_url}/api/generate",
                        json={
                            "model": self.model,
                            "prompt": f"{system_prompt}\n\n{user_prompt}",
                            "stream": False,
                            "format": "json"
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    content = data.get("response", "")
                    
                    # Try to extract JSON
                    try:
                        start = content.find("{")
                        end = content.rfind("}") + 1
                        if start != -1 and end != 0:
                            json_str = content[start:end]
                            result = json.loads(json_str)
                        else:
                            result = json.loads(content)
                    except json.JSONDecodeError:
                        # Fallback structure
                        result = {
                            "title": f"Test Plan: {issue.summary}",
                            "executive_summary": f"Test plan for {issue.key}",
                            "scope_objectives": "Test the feature as described",
                            "test_strategy": "Manual and automated testing",
                            "test_environment": "Standard test environment",
                            "entry_criteria": ["Code is deployed", "Test data is prepared"],
                            "exit_criteria": ["All tests pass", "No critical defects"],
                            "risks_mitigations": [{"description": "Delays", "impact": "Medium", "mitigation": "Buffer time"}],
                            "test_schedule": [{"phase": "Execution", "duration": "1 week", "activities": ["Run tests"]}],
                            "resource_requirements": [{"type": "Human", "description": "QA Engineer", "quantity": "1"}],
                            "test_cases": [
                                {
                                    "id": "TC-001",
                                    "title": f"Verify {issue.summary}",
                                    "description": content[:500],
                                    "preconditions": [],
                                    "steps": ["Execute test"],
                                    "expected_results": ["Feature works as expected"],
                                    "priority": "High",
                                    "test_type": "Functional"
                                }
                            ]
                        }
                    
                    # Parse test cases
                    test_cases = []
                    for i, tc in enumerate(result.get("test_cases", [])):
                        test_cases.append(TestCase(
                            id=tc.get("id", f"TC-{i+1:03d}"),
                            title=tc.get("title", ""),
                            description=tc.get("description", ""),
                            preconditions=tc.get("preconditions", []),
                            steps=tc.get("steps", []),
                            expected_results=tc.get("expected_results", []),
                            priority=tc.get("priority", "Medium"),
                            test_type=tc.get("test_type", "Functional")
                        ))
                    
                    # Parse risks
                    risks = []
                    for risk in result.get("risks_mitigations", []):
                        risks.append(RiskItem(
                            description=risk.get("description", ""),
                            impact=risk.get("impact", "Medium"),
                            mitigation=risk.get("mitigation", "")
                        ))
                    
                    # Parse schedule
                    schedule = []
                    for phase in result.get("test_schedule", []):
                        schedule.append(TestSchedule(
                            phase=phase.get("phase", ""),
                            duration=phase.get("duration", ""),
                            activities=phase.get("activities", [])
                        ))
                    
                    # Parse resources
                    resources = []
                    for resource in result.get("resource_requirements", []):
                        resources.append(ResourceRequirement(
                            type=resource.get("type", ""),
                            description=resource.get("description", ""),
                            quantity=resource.get("quantity")
                        ))
                    
                    return ComprehensiveTestPlan(
                        title=result.get("title", f"Test Plan: {issue.summary}"),
                        source_issue=issue.key,
                        generated_at=datetime.utcnow(),
                        executive_summary=result.get("executive_summary", ""),
                        scope_objectives=result.get("scope_objectives", ""),
                        test_strategy=result.get("test_strategy", ""),
                        test_environment=result.get("test_environment", ""),
                        entry_criteria=result.get("entry_criteria", []),
                        exit_criteria=result.get("exit_criteria", []),
                        risks_mitigations=risks,
                        test_schedule=schedule,
                        resource_requirements=resources,
                        test_cases=test_cases,
                        metadata={
                            "provider": "ollama",
                            "model": self.model,
                            "total_tests": len(test_cases),
                            "comprehensive": True
                        }
                    )
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to generate test plan after {max_retries} attempts: {e}")
                await asyncio.sleep(2 ** attempt)


def get_llm_provider(config: LLMConfig) -> LLMProviderBase:
    """Factory function to get the appropriate LLM provider."""
    if config.provider == LLMProvider.GROQ:
        return GroqProvider(
            api_key=config.groq_api_key or "",
            model=config.groq_model or "llama-3.3-70b-versatile",
            temperature=config.temperature
        )
    elif config.provider == LLMProvider.OLLAMA:
        return OllamaProvider(
            base_url=config.ollama_base_url or "http://localhost:11434",
            model=config.ollama_model
        )
    else:
        raise ValueError(f"Unknown provider: {config.provider}")
