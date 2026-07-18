"""
main.py — FastAPI backend for Daedalus AI Co-Founder.

SSE Protocol (matches useSSE.js exactly):
  data: <json>\\n\\n  — incremental chunks; any subset of PipelineState keys
  data: [DONE]\\n\\n   — signals stream completion

Chunk keys recognised by useSSE.js:
  round1.pm / round1.ui / round1.backend / round1.marketing
  round2_critique
  startup_score
  domain
  idea
  session_id  ← signals the stream is done; used as ?id= in /export/*

Export endpoints:
  GET /export/pitch-deck?id=<session_id>   → .pptx
  GET /export/wireframe?id=<session_id>    → .html
  GET /export/code-skeleton?id=<session_id>→ .zip
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

# ── Artifact generators ────────────────────────────────────────────────────────
from artifacts.pitch_deck     import generate_pitch_deck
from artifacts.wireframe_gen  import generate_wireframe
from artifacts.code_skeleton  import generate_code_skeleton

# ── Orchestrator ───────────────────────────────────────────────────────────────
try:
    from orchestrator.graph import run_pipeline_async
    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    run_pipeline_async = None          # type: ignore[assignment]
    ORCHESTRATOR_AVAILABLE = False

# ── Fallback / normalise ───────────────────────────────────────────────────────
from orchestrator.fallback_tailor import tailor_fallback_for_idea
from orchestrator.normalize       import normalize_pipeline_output

# ── Session store ──────────────────────────────────────────────────────────────
sessions:     dict[str, dict] = {}          # in-memory: session_id → pipeline result
SESSIONS_DIR = Path("/tmp/ai-cofounder-sessions")
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Daedalus AI Co-Founder API",
    version="2.0.0",
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:5174,"
    "http://127.0.0.1:5173,http://127.0.0.1:3000",
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


# ── SSE helpers ────────────────────────────────────────────────────────────────

def _sse(data: dict) -> str:
    """Serialise a dict as a single SSE data line."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _sse_done() -> str:
    return "data: [DONE]\n\n"


# ─────────────────────────────────────────────────────────────────────────────
# Mock stream — used when ORCHESTRATOR_AVAILABLE is False
# Mirrors the live stream shape so the UI looks identical in demo mode.
# ─────────────────────────────────────────────────────────────────────────────

async def _mock_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    """Simulate the pipeline with realistic delays using fallback data."""
    data = normalize_pipeline_output(tailor_fallback_for_idea(idea))
    data["idea"] = idea.strip()

    # Immediately broadcast domain/idea so the UI can show context
    yield _sse({"domain": data.get("domain", ""), "idea": data["idea"]})

    # Round 1 — show a thinking placeholder then the real data for each agent
    for agent_key in ("pm", "ui", "backend", "marketing"):
        yield _sse({"round1": {agent_key: {"_streaming": True}}})
        await asyncio.sleep(0.9)

        agent_data = data.get("round1", {}).get(agent_key, {})
        yield _sse({"round1": {agent_key: agent_data}})
        await asyncio.sleep(0.35)

    # Round 2 — investor + skeptic critique
    await asyncio.sleep(0.7)
    yield _sse({"round2_critique": {"investor_concerns": [], "skeptic_flags": [], "revisions": {}}})
    await asyncio.sleep(1.1)
    yield _sse({"round2_critique": data.get("round2_critique", {})})

    # Score
    await asyncio.sleep(0.5)
    yield _sse({"startup_score": data.get("startup_score", {})})

    # Store + generate artifacts in background
    sessions[session_id] = data
    asyncio.create_task(_generate_artifacts(session_id, data))

    await asyncio.sleep(0.2)
    yield _sse({"session_id": session_id})
    yield _sse_done()


# ─────────────────────────────────────────────────────────────────────────────
# Live stream — runs the DeepSeek pipeline, streams progressively
# ─────────────────────────────────────────────────────────────────────────────

async def _live_stream(idea: str, session_id: str) -> AsyncGenerator[str, None]:
    """
    Calls run_pipeline_async() and streams the result back chunk by chunk.
    Falls back to _mock_stream on any unhandled error.
    """
    try:
        # Show immediate "thinking" state for all 4 agents so the UI
        # doesn't sit blank while DeepSeek processes the full prompt.
        for agent_key in ("pm", "ui", "backend", "marketing"):
            yield _sse({"round1": {agent_key: {"_streaming": True}}})
        await asyncio.sleep(0.05)  # flush to client

        # ── Single DeepSeek call via run_pipeline_async ───────────────
        result = await run_pipeline_async(idea, use_fallback_on_error=True)

        # Always ensure idea is set
        result["idea"] = result.get("idea") or idea.strip()

        # Broadcast domain + idea immediately after the call completes
        yield _sse({
            "domain": result.get("domain", ""),
            "idea":   result["idea"],
        })
        await asyncio.sleep(0.05)

        # Stream round1 agents one by one for a progressive reveal
        round1 = result.get("round1", {})
        for agent_key in ("pm", "ui", "backend", "marketing"):
            if round1.get(agent_key):
                yield _sse({"round1": {agent_key: round1[agent_key]}})
                await asyncio.sleep(0.12)

        # Round 2 critique
        r2 = result.get("round2_critique")
        if r2:
            yield _sse({"round2_critique": r2})
            await asyncio.sleep(0.1)

        # Score
        score = result.get("startup_score")
        if score:
            yield _sse({"startup_score": score})
            await asyncio.sleep(0.1)

        # Store session + generate artifacts in background
        sessions[session_id] = result
        asyncio.create_task(_generate_artifacts(session_id, result))

        # Final chunk — session_id signals completion to useSSE.js
        yield _sse({"session_id": session_id})
        yield _sse_done()

    except Exception as exc:
        print(f"[live_stream] Unexpected error: {exc!r} — switching to mock stream")
        async for chunk in _mock_stream(idea, session_id):
            yield chunk


# ─────────────────────────────────────────────────────────────────────────────
# Artifact generation (background task)
# ─────────────────────────────────────────────────────────────────────────────

async def _generate_artifacts(session_id: str, pipeline_result: dict) -> None:
    """
    Pre-generate all three artifacts so export downloads are instant.
    Each artifact is written to /tmp/ai-cofounder-sessions/<session_id>/.
    Failures are logged but do not bubble up — the export endpoints handle
    on-demand generation as a fallback.
    """
    session_dir = SESSIONS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    idea        = pipeline_result.get("startup_name") or pipeline_result.get("idea", "startup")
    ui_spec     = pipeline_result.get("round1", {}).get("ui", {})
    backend_spec= pipeline_result.get("round1", {}).get("backend", {})

    # Pitch deck (.pptx)
    try:
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, pipeline_result)
        (session_dir / "pitch_deck.pptx").write_bytes(pptx_bytes)
        print(f"[artifacts:{session_id}] pitch_deck.pptx ready ({len(pptx_bytes):,} bytes)")
    except Exception as e:
        print(f"[artifacts:{session_id}] pitch_deck failed: {e}")

    # Wireframe (.html)
    try:
        await generate_wireframe(ui_spec, idea, session_dir)
        print(f"[artifacts:{session_id}] wireframe.html ready")
    except Exception as e:
        print(f"[artifacts:{session_id}] wireframe failed: {e}")

    # Code skeleton (.zip)
    try:
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, session_dir)
        print(f"[artifacts:{session_id}] code_skeleton.zip ready")
    except Exception as e:
        print(f"[artifacts:{session_id}] code_skeleton failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name":    "Daedalus AI Co-Founder API",
        "version": "2.0.0",
        "status":  "running",
        "docs":    "/docs",
        "health":  "/health",
    }


@app.get("/health")
async def health():
    return {
        "status":                 "ok",
        "orchestrator_available": ORCHESTRATOR_AVAILABLE,
        "mode":                   "live" if ORCHESTRATOR_AVAILABLE else "mock",
    }


@app.post("/build-startup")
async def build_startup(req: BuildStartupRequest):
    idea = (req.idea or "").strip()
    if not idea:
        raise HTTPException(status_code=400, detail="Idea cannot be empty.")

    session_id = str(uuid.uuid4())

    stream = (
        _live_stream(idea, session_id)
        if ORCHESTRATOR_AVAILABLE
        else _mock_stream(idea, session_id)
    )

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",       # disables nginx/Caddy buffering
            "Connection":        "keep-alive",
        },
    )


# ── Export endpoints ───────────────────────────────────────────────────────────

@app.get("/export/pitch-deck")
async def export_pitch_deck(id: str = Query(..., description="Session ID from the SSE stream")):
    file_path = SESSIONS_DIR / id / "pitch_deck.pptx"

    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found. Run /build-startup first.")
        pptx_bytes = await asyncio.to_thread(generate_pitch_deck, result)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(pptx_bytes)

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="daedalus_pitch_deck.pptx",
    )


@app.get("/export/wireframe")
async def export_wireframe(id: str = Query(..., description="Session ID from the SSE stream")):
    file_path = SESSIONS_DIR / id / "wireframe.html"

    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found. Run /build-startup first.")
        ui_spec = result.get("round1", {}).get("ui", {})
        idea    = result.get("startup_name") or result.get("idea", "startup")
        from artifacts.wireframe_gen import _generate_from_template
        html = _generate_from_template(ui_spec, idea)
        file_path.write_text(html, encoding="utf-8")

    return FileResponse(
        path=str(file_path),
        media_type="text/html",
        filename="daedalus_wireframe.html",
    )


@app.get("/export/code-skeleton")
async def export_code_skeleton(id: str = Query(..., description="Session ID from the SSE stream")):
    file_path = SESSIONS_DIR / id / "code_skeleton.zip"

    if not file_path.exists():
        result = sessions.get(id)
        if not result:
            raise HTTPException(status_code=404, detail="Session not found. Run /build-startup first.")
        backend_spec = result.get("round1", {}).get("backend", {})
        idea         = result.get("startup_name") or result.get("idea", "startup")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(generate_code_skeleton, backend_spec, idea, file_path.parent)

    return FileResponse(
        path=str(file_path),
        media_type="application/zip",
        filename="daedalus_code_skeleton.zip",
    )
