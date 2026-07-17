"""
orchestrator/graph.py
Orchestration pipeline — uses a single DeepSeek master agent call to
produce all 6-agent output in one shot, then normalises and scores it.

Exported symbols consumed by main.py:
  run_pipeline_async(idea)  → PipelineState
  run_pipeline(idea)        → PipelineState  (sync wrapper)
"""

from __future__ import annotations

import asyncio
from typing import Any, TypedDict

from . import agents, scoring
from .normalize import normalize_pipeline_output
from .fallback_tailor import tailor_fallback_for_idea


# ─────────────────────────────────────────────────────────────────────────────
# Shared state contract (matches useSSE.js expectations exactly)
# ─────────────────────────────────────────────────────────────────────────────

class PipelineState(TypedDict, total=False):
    idea:           str
    domain:         str
    idea_context:   dict[str, Any]
    round1:         dict[str, Any]
    round2_critique: dict[str, Any]
    startup_score:  dict[str, int]


# ─────────────────────────────────────────────────────────────────────────────
# Fallback helpers
# ─────────────────────────────────────────────────────────────────────────────

def first_fallback_sample(idea: str = "") -> PipelineState:
    """Return a normalised fallback result — used when the API is down."""
    result = tailor_fallback_for_idea(idea)
    # Always recompute score so the 6 canonical keys are present,
    # regardless of what's stored in fallback_data.json.
    result["startup_score"] = scoring.compute_startup_score(result)
    return normalize_pipeline_output(result)


# ─────────────────────────────────────────────────────────────────────────────
# Core pipeline — single DeepSeek call
# ─────────────────────────────────────────────────────────────────────────────

async def _pipeline_direct(idea: str) -> PipelineState:
    """
    Call the DeepSeek master agent once and unpack the full 6-agent JSON.
    Falls back to idea-tailored static data on any error.
    """
    master_result = await agents.run_master_agent(idea)

    # Build the PipelineState from the master result
    domain         = master_result.get("domain", "Unknown")
    idea_context   = master_result.get("idea_context") or {
        "domain":   domain,
        "audience": (master_result.get("round1", {})
                     .get("pm", {})
                     .get("target_user", "General users")),
        "problem":  (master_result.get("round1", {})
                     .get("pm", {})
                     .get("problem", "")),
        "constraints": [],
        "keywords":    [],
    }
    round1          = master_result.get("round1", {})
    round2_critique = master_result.get("round2_critique", {})

    output: PipelineState = {
        "idea":           idea.strip(),
        "domain":         domain,
        "idea_context":   idea_context,
        "round1":         round1,
        "round2_critique": round2_critique,
        "startup_score":  master_result.get("startup_score"),
    }
    output["startup_score"] = scoring.compute_startup_score(output)
    return normalize_pipeline_output(output)


# ─────────────────────────────────────────────────────────────────────────────
# Public API consumed by main.py
# ─────────────────────────────────────────────────────────────────────────────

async def run_pipeline_async(
    idea: str,
    *,
    use_fallback_on_error: bool = True,
) -> PipelineState:
    """
    Run the complete pipeline and return the shared output contract.

    On any exception (network, JSON parse, API quota, etc.):
      - If use_fallback_on_error=True  → return idea-tailored static fallback
      - If use_fallback_on_error=False → re-raise
    """
    try:
        return await _pipeline_direct(idea.strip())
    except Exception as exc:
        print(f"[run_pipeline_async] Pipeline failed: {type(exc).__name__}: {exc}")
        if not use_fallback_on_error:
            raise
        print("[run_pipeline_async] Returning tailored fallback data.")
        return first_fallback_sample(idea)


def run_pipeline(
    idea: str,
    *,
    use_fallback_on_error: bool = True,
) -> PipelineState:
    """Synchronous wrapper around run_pipeline_async."""
    return asyncio.run(
        run_pipeline_async(idea, use_fallback_on_error=use_fallback_on_error)
    )
