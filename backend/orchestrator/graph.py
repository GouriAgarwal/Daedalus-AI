"""LangGraph orchestration for the Person A startup validator pipeline."""

from __future__ import annotations

import asyncio
import copy
from typing import Any, TypedDict

from . import agents, critique, scoring
from .domain_classifier import detect_domain


class PipelineState(TypedDict, total=False):
    idea: str
    domain: str
    idea_context: dict[str, Any]
    round1: dict[str, Any]
    round2_critique: dict[str, Any]
    startup_score: dict[str, int]


from .fallback_tailor import tailor_fallback_for_idea
from .normalize import normalize_pipeline_output


def first_fallback_sample(idea: str = "") -> PipelineState:
    return normalize_pipeline_output(tailor_fallback_for_idea(idea))


async def _run_agent_safe(agent_fn, fallback_data: dict[str, Any], agent_key: str, *args):
    """Run a single agent; on failure return tailored fallback for that agent only."""
    try:
        return await asyncio.to_thread(agent_fn, *args)
    except Exception as exc:
        print(f"[round1] {agent_key} agent failed: {type(exc).__name__}: {exc}")
        return fallback_data.get(agent_key, {})


async def _run_round1(idea: str, idea_context: dict[str, Any]) -> dict[str, Any]:
    fallback = tailor_fallback_for_idea(idea)
    fb_round1 = fallback.get("round1", {})

    pm_input = {"idea": idea, "idea_context": idea_context}
    pm_result = await _run_agent_safe(agents.run_pm, fb_round1, "pm", pm_input)

    shared_input = {
        "idea": idea,
        "idea_context": idea_context,
        "pm": pm_result,
    }
    ui_result, backend_result, marketing_result = await asyncio.gather(
        _run_agent_safe(agents.run_ui, fb_round1, "ui", shared_input),
        _run_agent_safe(agents.run_backend, fb_round1, "backend", shared_input),
        _run_agent_safe(agents.run_marketing, fb_round1, "marketing", shared_input),
    )

    return {
        "pm": pm_result,
        "ui": ui_result,
        "backend": backend_result,
        "marketing": marketing_result,
    }


async def _pipeline_direct(idea: str) -> PipelineState:
    idea_context = await asyncio.to_thread(detect_domain, idea)
    round1 = await _run_round1(idea, idea_context)
    round2 = await asyncio.to_thread(critique.run_critique, round1, idea_context)
    revisions = await asyncio.to_thread(
        critique.revise_flagged_agents,
        round1,
        round2,
        idea_context,
    )

    final_round1 = copy.deepcopy(round1)
    final_round1.update(revisions)
    round2["revisions"] = revisions
    round2.pop("revision_requests", None)

    output: PipelineState = {
        "idea": idea,
        "domain": idea_context.get("domain", "Unknown"),
        "idea_context": idea_context,
        "round1": final_round1,
        "round2_critique": round2,
    }
    output["startup_score"] = scoring.compute_startup_score(output)
    return normalize_pipeline_output(output)


def _classify_node(state: PipelineState) -> PipelineState:
    idea_context = detect_domain(state["idea"])
    return {
        **state,
        "domain": idea_context.get("domain", "Unknown"),
        "idea_context": idea_context,
    }


def _round1_node(state: PipelineState) -> PipelineState:
    round1 = asyncio.run(_run_round1(state["idea"], state["idea_context"]))
    return {**state, "round1": round1}


def _critique_node(state: PipelineState) -> PipelineState:
    round2 = critique.run_critique(state["round1"], state["idea_context"])
    revisions = critique.revise_flagged_agents(
        state["round1"],
        round2,
        state["idea_context"],
    )
    final_round1 = copy.deepcopy(state["round1"])
    final_round1.update(revisions)
    round2["revisions"] = revisions
    round2.pop("revision_requests", None)
    return {**state, "round1": final_round1, "round2_critique": round2}


def _score_node(state: PipelineState) -> PipelineState:
    return {**state, "startup_score": scoring.compute_startup_score(state)}


def build_graph():
    """Build the LangGraph StateGraph if langgraph is installed."""

    try:
        from langgraph.graph import END, StateGraph
    except ImportError as exc:
        raise RuntimeError("langgraph is required to build the graph.") from exc

    graph = StateGraph(PipelineState)
    graph.add_node("classify_domain", _classify_node)
    graph.add_node("round1_agents", _round1_node)
    graph.add_node("critique_and_revision", _critique_node)
    graph.add_node("score", _score_node)

    graph.set_entry_point("classify_domain")
    graph.add_edge("classify_domain", "round1_agents")
    graph.add_edge("round1_agents", "critique_and_revision")
    graph.add_edge("critique_and_revision", "score")
    graph.add_edge("score", END)
    return graph.compile()


async def run_pipeline_async(idea: str, *, use_fallback_on_error: bool = True) -> PipelineState:
    """Run the complete Person A pipeline and return the shared output contract."""

    try:
        return await _pipeline_direct(idea.strip())
    except Exception as exc:
        print(f"[run_pipeline_async] Pipeline failed: {type(exc).__name__}: {exc}")
        if not use_fallback_on_error:
            raise
        return first_fallback_sample(idea)


def run_pipeline(idea: str, *, use_fallback_on_error: bool = True) -> PipelineState:
    return asyncio.run(
        run_pipeline_async(idea, use_fallback_on_error=use_fallback_on_error)
    )
