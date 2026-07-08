"""Startup Score calculation for the radar chart."""

from __future__ import annotations

from typing import Any

SEVERITY_PENALTIES = {"low": 0.5, "medium": 1.0, "high": 2.0}


def _count_items(value: Any) -> int:
    return len(value) if isinstance(value, list) else 0


def _clamp_score(value: float) -> int:
    return max(1, min(10, round(value)))


def compute_startup_score(final_json: dict[str, Any]) -> dict[str, int]:
    """Compute deterministic 1-10 scores from the final pipeline JSON."""

    round1 = final_json.get("round1", {})
    critique = final_json.get("round2_critique", {})
    pm = round1.get("pm", {})
    backend = round1.get("backend", {})
    marketing = round1.get("marketing", {})

    concerns = critique.get("investor_concerns", []) + critique.get("skeptic_flags", [])
    # Handle both formats: flat strings (fallback data) and dicts with severity (live Gemini output)
    def _concern_penalty(c):
        if isinstance(c, dict):
            return SEVERITY_PENALTIES.get(c.get("severity"), 0.5)
        return 0.5  # flat string — default medium penalty
    penalty = sum(_concern_penalty(c) for c in concerns)

    feasibility = (
        6
        + min(_count_items(pm.get("mvp_features")), 6) * 0.35
        + min(_count_items(backend.get("api_endpoints")), 6) * 0.25
        - penalty * 0.35
    )
    market_size = (
        6
        + min(_count_items(marketing.get("channels")), 5) * 0.35
        + min(_count_items(marketing.get("competitors")), 5) * 0.2
        - penalty * 0.2
    )
    differentiation = (
        5
        + min(_count_items(marketing.get("value_props")), 5) * 0.45
        + min(_count_items(pm.get("success_metrics")), 5) * 0.2
        - penalty * 0.25
    )
    team_fit = (
        6
        + min(_count_items(pm.get("risks")), 5) * 0.15
        + min(_count_items(backend.get("technical_risks")), 5) * 0.15
        - penalty * 0.15
    )

    return {
        "feasibility": _clamp_score(feasibility),
        "market_size": _clamp_score(market_size),
        "differentiation": _clamp_score(differentiation),
        "team_fit": _clamp_score(team_fit),
    }
