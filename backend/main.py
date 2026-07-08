"""
main.py — FastAPI backend for AI Co-Founder Team
Person B owns this file.

Endpoints:
  POST /build-startup          → SSE stream of pipeline events
  GET  /export/pitch-deck      → .pptx download
  GET  /export/wireframe       → .html download
  GET  /export/code-skeleton   → .zip download
  GET  /health                 → sanity check
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

load_dotenv()

# ── Artifact generators (Person B) ──────────────────────────────────────────
from artifacts.pitch_deck import generate_pitch_deck
from artifacts.wireframe_gen import generate_wireframe
from artifacts.code_skeleton import generate_code_skeleton

# ── Orchestrator (Person A) — graceful fallback if not yet implemented ───────
try:
    from orchestrator.graph import run_pipeline
    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    run_pipeline = None
    ORCHESTRATOR_AVAILABLE = False

# ── Fallback data ─────────────────────────────────────────────────────────────
_FALLBACK_PATH = Path(__file__).parent / "orchestrator" / "fallback_data.json"
with open(_FALLBACK_PATH) as f:
    FALLBACK_DATA: dict = json.load(f)

# ── In-memory session store ───────────────────────────────────────────────────
# Keys: session_id (str) → pipeline result dict
# In production: replace with Redis
sessions: dict[str, dict] = {}

# ── Temp file directory ───────────────────────────────────────────────────────
SESSIONS_DIR = Path("/tmp/ai-cofounder-sessions")
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Co-Founder Team API",
    description="Multi-agent startup validation backend. Person B.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict in prod: ["https://your-vercel-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────────────────────

class BuildStartupRequest(BaseModel):
    idea: str


# ─────────────────────────────────────────────────────────────────────────────
# SSE helpers
# ─────────────────────────────────────────────────────────────────────────────

def _sse(event: str, data: dict | str) -> str:
    """Format a single Server-Sent Event string."""
    payload = data if isinstance(data, str) else json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


async def _mock_pipeline_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    """
    Mock SSE stream used when Person A's orchestrator is not yet available.
    Replays FALLBACK_DATA with realistic delays so the frontend can be developed
    against this endpoint immediately.
    """
    data = dict(FALLBACK_DATA)  # shallow copy
    data["idea"] = idea

    agents_order = ["pm", "ui", "backend", "marketing"]

    # Round 1 — agent cards streaming in
    for agent_key in agents_order:
        yield _sse("agent_update", {
            "agent": agent_key,
            "status": "thinking",
            "data": {}
        })
        await asyncio.sleep(1.2)

        agent_data = data["round1"].get(agent_key, {})
        yield _sse("agent_update", {
            "agent": agent_key,
            "status": "done",
            "data": agent_data
        })
        await asyncio.sleep(0.5)

    # Round 2 — Investor & Skeptic critique
    yield _sse("agent_update", {"agent": "investor", "status": "thinking", "data": {}})
    await asyncio.sleep(1.5)

    for concern in data["round2_critique"]["investor_concerns"]:
        yield _sse("critique_update", {
            "type": "concern",
            "from": "investor",
            "target": "pm",
            "content": concern
        })
        await asyncio.sleep(0.6)

    yield _sse("agent_update", {"agent": "investor", "status": "done", "data": {}})

    yield _sse("agent_update", {"agent": "skeptic", "status": "thinking", "data": {}})
    await asyncio.sleep(1.5)

    for flag in data["round2_critique"]["skeptic_flags"]:
        yield _sse("critique_update", {
            "type": "concern",
            "from": "skeptic",
            "target": "pm",
            "content": flag
        })
        await asyncio.sleep(0.6)

    yield _sse("agent_update", {"agent": "skeptic", "status": "done", "data": {}})

    # Round 3 — Revisions
    for agent_key, revised in data["round2_critique"]["revisions"].items():
        yield _sse("critique_update", {
            "type": "revision",
            "from": agent_key,
            "target": agent_key,
            "content": revised
        })
        await asyncio.sleep(0.8)

    # Score
    yield _sse("score", data["startup_score"])
    await asyncio.sleep(0.3)

    # Store session for artifact export
    sessions[session_id] = data

    # Pre-generate artifacts in the background (non-blocking)
    asyncio.create_task(_generate_artifacts(session_id, data))

    # Signal completion
    yield _sse("complete", {"session_id": session_id})


async def _real_pipeline_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    """
    Calls Person A's LangGraph orchestrator and streams events.
    run_pipeline() must be an async generator yielding dicts with shape:
      { "event": str, "data": dict }
    """
    async for event_dict in run_pipeline(idea):  # type: ignore[misc]
        event_name = event_dict.get("event", "agent_update")
        event_data = event_dict.get("data", {})
        yield _sse(event_name, event_data)

    # After pipeline completes, retrieve the full result and store it
    # Person A's run_pipeline should expose a way to get final state —
    # adjust this once Person A's API is confirmed.
    # For now we fall back to fallback data shape for artifact generation.
    final_result = event_dict.get("final_result", FALLBACK_DATA)  # type: ignore[possibly-undefined]
    sessions[session_id] = final_result
    asyncio.create_task(_generate_artifacts(session_id, final_result))
    yield _sse("complete", {"session_id": session_id})


async def _generate_artifacts(session_id: str, pipeline_result: dict) -> None:
    """
    Pre-generate all three artifacts after pipeline completes.
    Runs in background so /build-startup can return quickly.
    """
    session_dir = SESSIONS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        # 1. Pitch deck
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, pipeline_result)
        (session_dir / "pitch_deck.pptx").write_bytes(pptx_bytes)
    except Exception as e:
        print(f"[artifacts] pitch_deck failed for {session_id}: {e}")

    try:
        # 2. Wireframe
        ui_spec = pipeline_result.get("round1", {}).get("ui", {})
        idea = pipeline_result.get("idea", "startup")
        await generate_wireframe(ui_spec, idea, session_dir)
    except Exception as e:
        print(f"[artifacts] wireframe failed for {session_id}: {e}")

    try:
        # 3. Code skeleton
        backend_spec = pipeline_result.get("round1", {}).get("backend", {})
        idea = pipeline_result.get("idea", "startup")
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, session_dir)
    except Exception as e:
        print(f"[artifacts] code_skeleton failed for {session_id}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    """Sanity check — returns orchestrator availability status."""
    return {
        "status": "ok",
        "orchestrator_available": ORCHESTRATOR_AVAILABLE,
        "mode": "live" if ORCHESTRATOR_AVAILABLE else "mock"
    }


@app.post("/build-startup", tags=["pipeline"])
async def build_startup(req: BuildStartupRequest):
    """
    Main endpoint — streams the multi-agent pipeline as Server-Sent Events.

    Event types emitted:
      agent_update   → { agent, status, data }
      critique_update → { type, from, target, content }
      score          → { feasibility, market_size, differentiation, team_fit, ... }
      complete       → { session_id }

    The session_id in the `complete` event is used for all /export/* calls.
    """
    if not req.idea or not req.idea.strip():
        raise HTTPException(status_code=400, detail="Idea cannot be empty")

    session_id = str(uuid.uuid4())

    if ORCHESTRATOR_AVAILABLE:
        stream = _real_pipeline_stream(req.idea.strip(), session_id)
    else:
        stream = _mock_pipeline_stream(req.idea.strip(), session_id)

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",       # Disable Nginx buffering on Render
            "Connection": "keep-alive",
        },
    )


@app.get("/export/pitch-deck", tags=["exports"])
async def export_pitch_deck(id: str = Query(..., description="Session ID from /build-startup")):
    """Download the generated .pptx pitch deck for a completed session."""
    file_path = SESSIONS_DIR / id / "pitch_deck.pptx"

    # If pre-generation hasn't finished yet, generate on-demand
    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, result)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(pptx_bytes)

    idea_slug = _idea_to_slug(sessions.get(id, {}).get("idea", "startup"))
    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=f"{idea_slug}_pitch_deck.pptx",
    )


@app.get("/export/wireframe", tags=["exports"])
async def export_wireframe(id: str = Query(..., description="Session ID from /build-startup")):
    """Download the generated HTML wireframe for a completed session."""
    file_path = SESSIONS_DIR / id / "wireframe.html"

    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        ui_spec = result.get("round1", {}).get("ui", {})
        idea = result.get("idea", "startup")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        await generate_wireframe(ui_spec, idea, file_path.parent)

    idea_slug = _idea_to_slug(sessions.get(id, {}).get("idea", "startup"))
    return FileResponse(
        path=str(file_path),
        media_type="text/html",
        filename=f"{idea_slug}_wireframe.html",
    )


@app.get("/export/code-skeleton", tags=["exports"])
async def export_code_skeleton(id: str = Query(..., description="Session ID from /build-startup")):
    """Download the generated code skeleton .zip for a completed session."""
    file_path = SESSIONS_DIR / id / "code_skeleton.zip"

    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        backend_spec = result.get("round1", {}).get("backend", {})
        idea = result.get("idea", "startup")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, file_path.parent)

    idea_slug = _idea_to_slug(sessions.get(id, {}).get("idea", "startup"))
    return FileResponse(
        path=str(file_path),
        media_type="application/zip",
        filename=f"{idea_slug}_code_skeleton.zip",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _idea_to_slug(idea: str) -> str:
    """Convert idea string to a filename-safe slug."""
    import re
    slug = re.sub(r"[^\w\s-]", "", idea.lower())
    slug = re.sub(r"[\s_-]+", "_", slug).strip("_")
    return slug[:40] or "startup"
