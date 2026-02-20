# Intelligent Test Plan Generator

A full-stack web application that automates test plan creation by integrating JIRA ticket data with LLM-powered analysis using customizable templates.

## Features

- 🔗 **JIRA Integration**: Fetch ticket details directly from JIRA
- 🤖 **Dual LLM Support**: Use Groq (cloud) or Ollama (local) for AI generation
- 📄 **Template Support**: Upload PDF templates to guide test plan structure
- 🎨 **Modern UI**: Clean, professional interface built with React + Tailwind CSS
- 📥 **Export Options**: Export generated test plans as Markdown or JSON
- 📜 **History Tracking**: Keep track of all generated test plans

## Tech Stack

**Backend:**
- Python 3.12+
- FastAPI
- SQLAlchemy (SQLite)
- Groq API SDK
- PyPDF for PDF parsing

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Markdown

## Quick Start

### Prerequisites

1. **Python 3.12+** installed
2. **Node.js 18+** installed
3. **JIRA API Token** ([Get one here](https://id.atlassian.com/manage-profile/security/api-tokens))
4. **Groq API Key** ([Get one here](https://console.groq.com/keys)) - optional if using Ollama
5. **Ollama** (optional, for local LLM) - [Install Ollama](https://ollama.com/)

### Installation

1. **Clone and navigate to the project:**
```bash
cd intelligent-test-plan-agent
```

2. **Set up the backend:**
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

3. **Set up the frontend:**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables:**
```bash
cd ../backend
copy .env.example .env
# Edit .env with your credentials
```

### Running the Application

**Option 1: Manual Start**

Terminal 1 (Backend):
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

**Option 2: Using the startup script**

On Windows:
```powershell
.\start.ps1
```

On macOS/Linux:
```bash
./start.sh
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### First Time Setup

1. Open http://localhost:5173
2. Go to **Settings**
3. Configure **JIRA**:
   - Enter your JIRA base URL (e.g., `https://yourcompany.atlassian.net`)
   - Enter your email/username
   - Enter your JIRA API token
   - Click "Save JIRA Settings"
4. Configure **LLM Provider**:
   - Choose Groq (cloud) or Ollama (local)
   - Enter API key for Groq, or ensure Ollama is running
   - Click "Save LLM Settings"
5. (Optional) Upload a **PDF template** for test plan structure

### Usage

1. Go to the **Generate** page
2. Enter a JIRA ticket ID (e.g., `PROJECT-123`)
3. Click "Fetch Ticket" to load ticket details
4. Review the ticket information
5. Select LLM provider and optional template
6. Click "Generate Test Plan"
7. View, copy, or export the generated test plan

### Keyboard Shortcuts

- `Ctrl+Enter` - Generate test plan
- `Ctrl+Shift+S` - Save

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/jira` | POST | Save JIRA credentials |
| `/api/settings/llm` | POST | Save LLM config |
| `/api/jira/fetch` | POST | Fetch JIRA ticket |
| `/api/templates/upload` | POST | Upload PDF template |
| `/api/testplan/generate` | POST | Generate test plan |
| `/api/testplan/history` | GET | Get generation history |

See full API documentation at http://localhost:8000/docs

## Project Structure

```
intelligent-test-plan-agent/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── database.py          # SQLAlchemy models
│   ├── services/
│   │   ├── jira_client.py   # JIRA API client
│   │   ├── llm_providers.py # Groq & Ollama providers
│   │   └── pdf_parser.py    # PDF parsing
│   └── routes/
│       ├── settings.py      # Settings API
│       ├── jira.py          # JIRA API
│       ├── templates.py     # Template API
│       └── testplan.py      # Test plan API
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── History.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
├── templates/               # Default templates storage
└── data/                    # SQLite database
```

## Troubleshooting

**Backend won't start:**
- Ensure Python 3.12+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`

**Frontend won't start:**
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

**JIRA connection fails:**
- Verify your JIRA base URL format: `https://domain.atlassian.net`
- Ensure your API token is valid
- Check that you have access to the project

**Groq generation fails:**
- Verify your Groq API key
- Check available models at https://console.groq.com/

**Ollama connection fails:**
- Ensure Ollama is running: `ollama serve`
- Verify the base URL (default: http://localhost:11434)
- Pull a model first: `ollama pull llama3.1`

## License

MIT
