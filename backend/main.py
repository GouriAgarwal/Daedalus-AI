"""
main.py — FastAPI backend (Person B) — INTEGRATION FIXED
Rewired to correctly call Person A's run_pipeline and emit SSE events
in the exact shape that Person C's useSSE.js expects.

Person C's useSSE.js expects plain `data: <json>` lines (no event: prefix)
and recognises the following keys in each chunk:
  - round1.pm / round1.ui / round1.backend / round1.marketing
  - round2_critique
  - startup_score
  - session_id   (signals completion)
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

# ── Artifact generators ──────────────────────────────────────────────────────
from artifacts.pitch_deck import generate_pitch_deck
from artifacts.wireframe_gen import generate_wireframe
from artifacts.code_skeleton import generate_code_skeleton

# ── Orchestrator (Person A) ──────────────────────────────────────────────────
try:
    from orchestrator.graph import run_pipeline_async
    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    run_pipeline_async = None
    ORCHESTRATOR_AVAILABLE = False

# ── Fallback data ────────────────────────────────────────────────────────────
from orchestrator.fallback_tailor import tailor_fallback_for_idea
from orchestrator.normalize import normalize_pipeline_output

_FALLBACK_PATH = Path(__file__).parent / "orchestrator" / "fallback_data.json"
try:
    with open(_FALLBACK_PATH) as f:
        FALLBACK_DATA: dict = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as _e:
    print(f"[WARN] Could not load fallback_data.json: {_e}")
    FALLBACK_DATA = {}

# ── Session store ────────────────────────────────────────────────────────────
sessions: dict[str, dict] = {}

SESSIONS_DIR = Path("/tmp/ai-cofounder-sessions")
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Daedalus AI Co-Founder API",
    version="1.0.0",
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BuildStartupRequest(BaseModel):
    idea: str


# ─────────────────────────────────────────────────────────────────────────────
# SSE helper — Person C's useSSE.js reads `data: <json>` lines
# ─────────────────────────────────────────────────────────────────────────────
def _sse_chunk(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _sse_done() -> str:
    return "data: [DONE]\n\n"


# ─────────────────────────────────────────────────────────────────────────────
# Mock stream — mirrors FALLBACK_DATA shape with realistic delays
# ─────────────────────────────────────────────────────────────────────────────
async def _mock_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    data = normalize_pipeline_output(tailor_fallback_for_idea(idea))

    # Round 1 — agents stream one by one
    for agent_key in ["pm", "ui", "backend", "marketing"]:
        # Show streaming placeholder first
        yield _sse_chunk({"round1": {agent_key: {"_streaming": True}}})
        await asyncio.sleep(1.0)

        # Then send real content
        agent_data = data.get("round1", {}).get(agent_key, {})
        yield _sse_chunk({"round1": {agent_key: agent_data}})
        await asyncio.sleep(0.4)

    # Round 2 — investor + skeptic critique
    await asyncio.sleep(0.8)
    yield _sse_chunk({"round2_critique": {
        "investor_concerns": [],
        "skeptic_flags": [],
        "revisions": {}
    }})
    await asyncio.sleep(1.2)
    yield _sse_chunk({"round2_critique": data["round2_critique"]})

    # Score
    await asyncio.sleep(0.6)
    yield _sse_chunk({"startup_score": data["startup_score"]})

    # Store session for artifact export
    sessions[session_id] = data
    asyncio.create_task(_generate_artifacts(session_id, data))

    # Send session_id + [DONE]
    await asyncio.sleep(0.2)
    yield _sse_chunk({"session_id": session_id})
    yield _sse_done()


# ─────────────────────────────────────────────────────────────────────────────
# Live stream — calls Person A's pipeline, streams incrementally
# ─────────────────────────────────────────────────────────────────────────────
async def _live_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    try:
        # Round 1 — show thinking placeholders immediately
        for agent_key in ["pm", "ui", "backend", "marketing"]:
            yield _sse_chunk({"round1": {agent_key: {"_streaming": True}}})

        # Run the full pipeline (Person A handles Claude calls internally)
        result = await run_pipeline_async(idea, use_fallback_on_error=True)
        result = normalize_pipeline_output(result)
        result["idea"] = result.get("idea") or idea.strip()

        # Stream round1 agents one by one for progressive UI reveal
        round1 = result.get("round1", {})
        for agent_key in ["pm", "ui", "backend", "marketing"]:
            if agent_key in round1:
                yield _sse_chunk({"round1": {agent_key: round1[agent_key]}})
                await asyncio.sleep(0.15)

        # Round 2 critique
        if result.get("round2_critique"):
            yield _sse_chunk({"round2_critique": result["round2_critique"]})
            await asyncio.sleep(0.15)

        # Score
        if result.get("startup_score"):
            yield _sse_chunk({"startup_score": result["startup_score"]})
            await asyncio.sleep(0.15)

        # Store & generate artifacts
        sessions[session_id] = result
        asyncio.create_task(_generate_artifacts(session_id, result))

        yield _sse_chunk({"session_id": session_id})
        yield _sse_done()

    except Exception as exc:
        print(f"[live_stream] error: {exc}, falling back to mock")
        async for chunk in _mock_stream(idea, session_id):
            yield chunk


# ─────────────────────────────────────────────────────────────────────────────
# Artifact pre-generation (background task)
# ─────────────────────────────────────────────────────────────────────────────
async def _generate_artifacts(session_id: str, pipeline_result: dict) -> None:
    session_dir = SESSIONS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, pipeline_result)
        (session_dir / "pitch_deck.pptx").write_bytes(pptx_bytes)
    except Exception as e:
        print(f"[artifacts] pitch_deck failed: {e}")

    try:
        ui_spec = pipeline_result.get("round1", {}).get("ui", {})
        idea = pipeline_result.get("idea", "startup")
        await generate_wireframe(ui_spec, idea, session_dir)
    except Exception as e:
        print(f"[artifacts] wireframe failed: {e}")

    try:
        backend_spec = pipeline_result.get("round1", {}).get("backend", {})
        idea = pipeline_result.get("idea", "startup")
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, session_dir)
    except Exception as e:
        print(f"[artifacts] code_skeleton failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "Daedalus AI Co-Founder API",
        "version": "1.0.0",
        "status": "running",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/health",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "orchestrator_available": ORCHESTRATOR_AVAILABLE,
        "mode": "live" if ORCHESTRATOR_AVAILABLE else "mock",
    }


@app.post("/build-startup")
async def build_startup(req: BuildStartupRequest):
    if not req.idea or not req.idea.strip():
        raise HTTPException(status_code=400, detail="Idea cannot be empty")

    session_id = str(uuid.uuid4())

    stream = (
        _live_stream(req.idea.strip(), session_id)
        if ORCHESTRATOR_AVAILABLE
        else _mock_stream(req.idea.strip(), session_id)
    )

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/export/pitch-deck")
async def export_pitch_deck(id: str = Query(...)):
    file_path = SESSIONS_DIR / id / "pitch_deck.pptx"
    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, result)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(pptx_bytes)
    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="daedalus_pitch_deck.pptx",
    )


@app.get("/export/wireframe")
async def export_wireframe(id: str = Query(...)):
    file_path = SESSIONS_DIR / id / "wireframe.html"
    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        ui_spec = result.get("round1", {}).get("ui", {})
        idea = result.get("idea", "startup")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        await generate_wireframe(ui_spec, idea, file_path.parent)
    return FileResponse(path=str(file_path), media_type="text/html",
                        filename="daedalus_wireframe.html")


@app.get("/export/code-skeleton")
async def export_code_skeleton(id: str = Query(...)):
    file_path = SESSIONS_DIR / id / "code_skeleton.zip"
    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        backend_spec = result.get("round1", {}).get("backend", {})
        idea = result.get("idea", "startup")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, file_path.parent)
    return FileResponse(path=str(file_path), media_type="application/zip",
                        filename="daedalus_code_skeleton.zip")
