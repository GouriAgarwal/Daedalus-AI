"""Round 2 critique and revision routing."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from . import agents

AGENT_NAMES = ("pm", "ui", "backend", "marketing")


def collect_revision_requests(
    investor_result: dict[str, Any],
    skeptic_result: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    """Group investor and skeptic concerns by the agent that should revise."""

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for source, key in ((investor_result, "concerns"), (skeptic_result, "flags")):
        for item in source.get(key, []):
            agent_name = item.get("agent")
            if agent_name in AGENT_NAMES:
                grouped[agent_name].append(item)
    return dict(grouped)


def run_critique(round1: dict[str, Any], idea_context: dict[str, Any]) -> dict[str, Any]:
    critique_input = {
        "idea_context": idea_context,
        "round1": round1,
    }
    investor = agents.run_investor(critique_input)
    skeptic = agents.run_skeptic(critique_input)
    return {
        "investor_concerns": investor.get("concerns", []),
        "skeptic_flags": skeptic.get("flags", []),
        "investment_thesis": investor.get("investment_thesis"),
        "ask_readiness": investor.get("ask_readiness"),
        "killer_questions": skeptic.get("killer_questions", []),
        "overall_risk": skeptic.get("overall_risk"),
        "revision_requests": collect_revision_requests(investor, skeptic),
    }


def revise_flagged_agents(
    round1: dict[str, Any],
    critique_result: dict[str, Any],
    idea_context: dict[str, Any],
) -> dict[str, Any]:
    revisions: dict[str, Any] = {}
    for agent_name, concerns in critique_result.get("revision_requests", {}).items():
        revision_input = {
            "idea_context": idea_context,
            "prior_output": round1[agent_name],
            "critique": concerns,
        }
        revisions[agent_name] = agents.revise_agent(agent_name, revision_input)
    return revisions
