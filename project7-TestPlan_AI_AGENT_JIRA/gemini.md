# Gemini: AI Agent JIRA Test Plan Generator

**Role:** Project Constitution — Data schemas, behavioral rules, architectural invariants  
**Status:** 🔵 Initialized - Awaiting Blueprint Phase

---

## 🏛️ Project Identity

**Name:** AI Agent for Automated JIRA Test Plan Generation  
**Mission:** Build deterministic, self-healing automation that generates comprehensive test plans from JIRA issues

---

## 📊 Data Schemas

### Input Schema (JIRA Issue)
*To be defined during Phase 1: Blueprint*

```json
{
  "jira_issue": {
    "key": "string",
    "summary": "string",
    "description": "string",
    "issue_type": "string",
    "priority": "string",
    "components": ["string"],
    "labels": ["string"],
    "acceptance_criteria": "string"
  }
}
```

### Output Schema (Test Plan)
*To be defined during Phase 1: Blueprint*

```json
{
  "test_plan": {
    "title": "string",
    "test_cases": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "preconditions": ["string"],
        "steps": ["string"],
        "expected_results": ["string"],
        "priority": "string",
        "test_type": "string"
      }
    ],
    "metadata": {
      "generated_at": "datetime",
      "source_issue": "string",
      "total_tests": "number"
    }
  }
}
```

---

## ⚖️ Behavioral Rules

### Do Rules
- *To be defined during Phase 1: Blueprint*

### Do Not Rules
- *To be defined during Phase 1: Blueprint*

---

## 🏗️ Architectural Invariants

### Layer 1: Architecture SOPs
- SOPs must be updated BEFORE code changes when logic changes
- All tools must have corresponding SOP documentation

### Layer 2: Navigation
- Complex tasks must be delegated to execution tools
- Navigation layer handles routing only, not execution

### Layer 3: Tools
- Tools must be atomic and independently testable
- Environment variables/tokens stored in `.env`
- All intermediate operations use `.tmp/` directory

---

## 🔧 Maintenance Log

### Schema Versions
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-16 | Initial schema templates created |

### Rule Changes
| Date | Rule | Reason |
|------|------|--------|
| - | - | - |

### Architecture Changes
| Date | Change | Impact |
|------|--------|--------|
| - | - | - |

---

## 📝 Notes

- This file is *LAW* — it defines the project's constitution
- Only update when schemas, rules, or architecture changes
- Planning files (`task_plan.md`, `findings.md`, `progress.md`) are *memory*

---

*Last Updated: 2026-02-16*  
*Next Review: After Phase 1: Blueprint completion*
