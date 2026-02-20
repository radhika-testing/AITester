"""JIRA API client service."""
import httpx
import json
import re
from typing import Optional, Dict, Any
from models import JiraIssue


class JiraClient:
    def __init__(self, base_url: str, username: str, api_token: str):
        self.base_url = base_url.rstrip("/")
        self.auth = (username, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test JIRA connection by fetching current user info."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/myself",
                auth=self.auth,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_issue(self, issue_key: str) -> JiraIssue:
        """Fetch a JIRA issue by key."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/issue/{issue_key}",
                auth=self.auth,
                headers=self.headers,
                params={"fields": "summary,description,issuetype,priority,status,assignee,labels,components,attachment"}
            )
            response.raise_for_status()
            data = response.json()
            
            return self._parse_issue(data)
    
    def _parse_issue(self, data: Dict[str, Any]) -> JiraIssue:
        """Parse JIRA API response into JiraIssue model."""
        fields = data.get("fields", {})
        
        # Extract description
        description = self._extract_text_from_adf(fields.get("description", {}))
        
        # Extract acceptance criteria from description
        acceptance_criteria = self._extract_acceptance_criteria(description)
        
        # Get assignee
        assignee = None
        if fields.get("assignee"):
            assignee = fields["assignee"].get("displayName")
        
        # Get attachments
        attachments = []
        for att in fields.get("attachment", []):
            attachments.append({
                "filename": att.get("filename"),
                "mimeType": att.get("mimeType"),
                "content": att.get("content")
            })
        
        return JiraIssue(
            key=data.get("key", ""),
            summary=fields.get("summary", ""),
            description=description,
            issue_type=fields.get("issuetype", {}).get("name", ""),
            priority=fields.get("priority", {}).get("name", "Medium"),
            status=fields.get("status", {}).get("name", ""),
            assignee=assignee,
            labels=fields.get("labels", []),
            components=[c.get("name", "") for c in fields.get("components", [])],
            acceptance_criteria=acceptance_criteria,
            attachments=attachments
        )
    
    def _extract_text_from_adf(self, adf: Dict[str, Any]) -> str:
        """Extract plain text from Atlassian Document Format."""
        if not adf:
            return ""
        
        texts = []
        
        def traverse(node):
            if isinstance(node, dict):
                if node.get("type") == "text":
                    texts.append(node.get("text", ""))
                elif "content" in node:
                    for child in node["content"]:
                        traverse(child)
            elif isinstance(node, list):
                for item in node:
                    traverse(item)
        
        traverse(adf)
        return " ".join(texts)
    
    def _extract_acceptance_criteria(self, description: str) -> Optional[str]:
        """Extract acceptance criteria from description."""
        # Common patterns for acceptance criteria
        patterns = [
            r"(?:Acceptance Criteria|AC|Scenario):\s*(.+?)(?=\n\n|\Z)",
            r"(?:Given|When|Then).*",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, description, re.IGNORECASE | re.DOTALL)
            if matches:
                return "\n".join(matches)
        
        return None


# Singleton instance
_jira_client: Optional[JiraClient] = None


def get_jira_client() -> Optional[JiraClient]:
    """Get the configured JIRA client."""
    return _jira_client


def set_jira_client(client: JiraClient):
    """Set the JIRA client."""
    global _jira_client
    _jira_client = client
