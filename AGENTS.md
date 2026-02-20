# Project Workspace Overview

This workspace contains multiple related projects focused on AI-assisted software engineering and test case generation.

## Projects Overview

### 1. Kimi Code CLI (`kimi-cli/`)

**Kimi Code CLI** is an AI agent that runs in the terminal, helping users complete software development tasks and terminal operations. It can read and edit code, execute shell commands, search and fetch web pages, and autonomously plan actions during execution.

**Key Features:**
- Interactive shell UI with command mode (Ctrl-X to toggle)
- VS Code extension integration
- ACP (Agent Client Protocol) support for IDE integrations
- MCP (Model Context Protocol) tool support
- Web UI for visual interaction
- Zsh integration support

### 2. Test Case Generator (`test-case-generator/`)

A standalone web application that generates comprehensive test cases using the Groq AI API. This is a client-side only application with no backend required.

**Key Features:**
- Multiple test types: functional, unit, integration, E2E, API, UI/UX, security, performance
- Multiple output formats: structured text, Gherkin, Markdown, JSON, CSV
- Local storage for API key and generation history
- Download and copy functionality for generated test cases

### 3. B.L.A.S.T. Protocol Documentation (`project7-TestPlan_AI_AGENT_JIRA/`)

Documentation for the B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger) protocol - a methodology for building deterministic, self-healing automation using the A.N.T. 3-layer architecture.

---

## Kimi Code CLI - Detailed Information

### Technology Stack

- **Python**: 3.12+ (tooling configured for 3.14)
- **CLI Framework**: Typer
- **Async Runtime**: asyncio
- **LLM Framework**: kosong (workspace package)
- **MCP Integration**: fastmcp
- **Web Framework**: FastAPI + uvicorn
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Package Management**: uv + uv_build
- **Testing**: pytest + pytest-asyncio
- **Linting/Formatting**: ruff
- **Type Checking**: pyright + ty
- **Binary Distribution**: PyInstaller

### Project Structure

```
kimi-cli/
├── src/kimi_cli/           # Main source code
│   ├── agents/             # Built-in agent YAML specs and prompts
│   ├── auth/               # OAuth and platform authentication
│   ├── cli/                # CLI entry points (Typer commands)
│   ├── prompts/            # Shared prompt templates
│   ├── skill/              # Skill system (flows and standard skills)
│   ├── skills/             # Built-in skill definitions
│   ├── soul/               # Core runtime/loop, context, compaction, approvals
│   ├── tools/              # Built-in tools (file, shell, web, etc.)
│   ├── ui/                 # UI frontends (shell/print/acp/wire)
│   ├── utils/              # Utility modules
│   ├── web/                # Web API and runner
│   └── wire/               # Event types and transport protocol
├── packages/               # Workspace packages
│   ├── kosong/             # LLM abstraction layer
│   ├── kaos/               # OS abstraction layer (PyKAOS)
│   └── kimi-code/          # Kimi Code package metadata
├── sdks/
│   └── kimi-sdk/           # Kimi SDK for external use
├── web/                    # React frontend source
├── tests/                  # Unit tests
├── tests_ai/               # AI-based test suite
├── tests_e2e/              # End-to-end tests
├── examples/               # Example projects
├── docs/                   # Documentation
└── klips/                  # Kimi Code CLI Improvement Proposals
```

### Build and Development Commands

**Setup:**
```bash
make prepare          # Sync deps for all workspace packages and install git hooks
```

**Development:**
```bash
uv run kimi           # Run Kimi Code CLI
make web-back         # Start web backend with uvicorn (reload enabled)
make web-front        # Start web frontend (vite dev server)
```

**Code Quality:**
```bash
make format           # Auto-format all workspace packages
make check            # Run linting and type checks for all packages
make test             # Run all test suites
make ai-test          # Run the test suite with Kimi Code CLI
```

**Build:**
```bash
make build-web        # Build web UI and sync into package
make build            # Build Python packages for release
make build-bin        # Build standalone executable with PyInstaller
```

### Key Configuration Files

- `pyproject.toml` - Main package configuration, dependencies, tool settings
- `Makefile` - Build automation and common commands
- `.python-version` - Python version specification
- `.pre-commit-config.yaml` - Pre-commit hooks configuration
- `web/package.json` - Frontend dependencies and scripts
- `web/tsconfig.json` - TypeScript configuration

### Code Style Guidelines

- **Line Length**: 100 characters
- **Python Version**: >=3.12 (configured for 3.14)
- **Ruff Rules**: E (pycodestyle), F (Pyflakes), UP (pyupgrade), B (bugbear), SIM (simplify), I (isort)
- **Type Checking**: Standard mode with strict checking for `src/kimi_cli/**/*.py`
- **Import Style**: Use `__future__.annotations` for forward references

### Testing Strategy

- **Unit Tests**: `tests/test_*.py` using pytest + pytest-asyncio
- **E2E Tests**: `tests_e2e/` for end-to-end scenarios
- **AI Tests**: `tests_ai/` for AI-powered test suite
- **Per-file Ignores**: Tests allow longer lines (E501 ignored)

### Versioning

The project follows a **minor-bump-only** versioning scheme (`MAJOR.MINOR.PATCH`):
- **Patch** version is always `0`
- **Minor** version is bumped for any change
- **Major** version only changed by explicit manual decision

Example: `0.68.0` → `0.69.0` (never `0.68.1`)

### Git Commit Convention

Conventional Commits format:
```
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `test`, `refactor`, `chore`, `style`, `docs`, `perf`, `build`, `ci`, `revert`

---

## Test Case Generator - Detailed Information

### Technology Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with CSS variables
- **Syntax Highlighting**: highlight.js
- **Icons**: Inline SVG
- **API**: Groq API (OpenAI-compatible)

### Project Structure

```
test-case-generator/
└── TESTCASE-GENERATOR-GROQ-API/
    ├── index.html        # Main HTML page
    ├── styles.css        # Styling and CSS variables
    └── app.js            # Application logic and API integration
```

### Features

1. **Test Types Supported:**
   - Functional Testing
   - Unit Testing
   - Integration Testing
   - End-to-End (E2E) Testing
   - API Testing
   - UI/UX Testing
   - Security Testing
   - Performance Testing

2. **Output Formats:**
   - Structured Text
   - Gherkin (Given/When/Then)
   - Markdown
   - JSON
   - CSV

3. **Supported Models:**
   - Llama 3.3 70B
   - Llama 3.1 8B
   - Mixtral 8x7B
   - Gemma 2 9B

### Usage

1. Open `index.html` in a web browser
2. Enter your Groq API key (stored locally in browser)
3. Describe the feature to test
4. Select test type, output format, and model
5. Click "Generate Test Cases"

### Build Process

No build process required - this is a static web application. Simply serve the files with any static file server or open `index.html` directly in a browser.

---

## B.L.A.S.T. Protocol

The B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger) protocol is a methodology for building deterministic, self-healing automation in Antigravity using the A.N.T. 3-layer architecture.

### Five Phases

1. **Blueprint** - Discovery, data schema definition, and research
2. **Link** - API connection verification and credential testing
3. **Architect** - 3-layer build (Architecture SOPs, Navigation, Tools)
4. **Stylize** - Output refinement and UI/UX formatting
5. **Trigger** - Cloud deployment and automation setup

### File Structure Convention

```
├── gemini.md          # Project Map & State Tracking
├── .env               # API Keys/Secrets
├── architecture/      # Layer 1: SOPs (The "How-To")
├── tools/             # Layer 3: Python Scripts (The "Engines")
└── .tmp/              # Temporary Workbench (Intermediates)
```

---

## Security Considerations

### Kimi Code CLI
- API keys stored in system keyring (via `keyring` library)
- User config at `~/.kimi/config.toml`
- MCP server configs stored in share directory
- OAuth flow implemented for secure authentication

### Test Case Generator
- API keys stored in browser localStorage (client-side only)
- No server-side storage or processing
- All API calls made directly from browser to Groq API

---

## Development Workflow

When working on these projects:

1. **For Kimi Code CLI changes:**
   - Use `make prepare` to set up the environment
   - Run `make format` and `make check` before committing
   - Use `uv run kimi` to test changes
   - Follow Conventional Commits for git messages

2. **For Test Case Generator changes:**
   - Edit files directly (no build step)
   - Test in browser
   - No formal testing framework (manual testing)

3. **For AI-assisted development:**
   - Kimi Code CLI can be used to work on itself (`uv run kimi`)
   - The B.L.A.S.T. protocol provides a structured approach for automation projects
