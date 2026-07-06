# AI Co-Founder Team 🚀

> *"Cursor builds your app in minutes. We tell you whether you should build it at all — and how, using a debating AI founding team."*

A multi-agent AI system where **6 specialized agents** (PM, UI Designer, Backend Architect, Marketing, Investor, Skeptic) act as a virtual founding team. Given any startup idea, they generate, critique, and revise a complete startup plan — then output a **Startup Score**, **pitch deck**, **wireframe**, and **code skeleton**.

---

## Architecture

```
User Input
    │
    ▼
React Frontend (Person C)  ←──SSE──→  FastAPI Backend (Person B)
                                              │
                                    LangGraph Orchestrator (Person A)
                                       + Claude API calls
                                    ┌──┬──┬──┬──┬──┬──┐
                                   PM UI BK MK IN SK  (agents)
                                              │
                              Final JSON: plan + score + revisions
                                              │
                          ┌───────────────────┼───────────────────┐
                       Pitch Deck (.pptx)  Wireframe (.html)  Code (.zip)
```

## Repo Structure

```
ai-cofounder-team/
├── backend/                  ← Person B
│   ├── main.py               # FastAPI app + SSE + export endpoints
│   ├── requirements.txt
│   ├── .env.example
│   ├── orchestrator/         ← Person A
│   │   ├── __init__.py       # Graceful import stub
│   │   ├── graph.py          # LangGraph pipeline (Person A)
│   │   ├── prompts.py        # 6 agent prompts (Person A)
│   │   ├── agents.py         # Claude API wrappers (Person A)
│   │   ├── critique.py       # Round 2 critique logic (Person A)
│   │   ├── scoring.py        # Startup Score calc (Person A)
│   │   └── fallback_data.json
│   └── artifacts/            ← Person B
│       ├── __init__.py
│       ├── pitch_deck.py     # python-pptx generator
│       ├── wireframe_gen.py  # HTML wireframe via Claude API
│       └── code_skeleton.py  # FastAPI project zip generator
│
└── frontend/                 ← Person C
    └── src/
        ├── App.jsx
        ├── components/
        └── hooks/
```

## Quick Start (Backend)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server status + orchestrator availability |
| `POST` | `/build-startup` | SSE stream — runs the multi-agent pipeline |
| `GET` | `/export/pitch-deck?id=` | Download `.pptx` pitch deck |
| `GET` | `/export/wireframe?id=` | Download `.html` wireframe |
| `GET` | `/export/code-skeleton?id=` | Download `.zip` code skeleton |

## SSE Event Schema

```jsonc
// event: agent_update
{ "agent": "pm|ui|backend|marketing|investor|skeptic", "status": "thinking|done", "data": {} }

// event: critique_update
{ "type": "concern|revision", "from": "investor|skeptic", "target": "pm|...", "content": "..." }

// event: score
{ "feasibility": 7, "market_size": 8, "differentiation": 6, "team_fit": 7 }

// event: complete
{ "session_id": "uuid" }  // use this id for /export/* endpoints
```

## Team

| Person | Role | Owns |
|--------|------|------|
| **Person A** | Agent Logic & Orchestration | `backend/orchestrator/` |
| **Person B** | Backend API & Artifact Generation | `backend/main.py`, `backend/artifacts/` |
| **Person C** | Frontend & Demo Experience | `frontend/src/` |
