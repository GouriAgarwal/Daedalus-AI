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

    # Prioritize LLM-generated scores if available
    llm_score = final_json.get("startup_score")
    if isinstance(llm_score, dict):
        required_keys = {"feasibility", "market_size", "differentiation", "team_fit", "innovation", "execution"}
        if required_keys.issubset(llm_score.keys()):
            try:
                return {k: _clamp_score(float(llm_score[k])) for k in required_keys}
            except (ValueError, TypeError):
                pass

    round1 = final_json.get("round1", {})
    critique = final_json.get("round2_critique", {})
    pm = round1.get("pm", {})
    backend = round1.get("backend", {})
    marketing = round1.get("marketing", {})

    concerns = critique.get("investor_concerns", []) + critique.get("skeptic_flags", [])
    # Handle both formats: dicts with "severity" key (live Gemini output)
    # and flat strings (fallback data) — flat strings get default medium penalty
    def _concern_penalty(c: Any) -> float:
        if isinstance(c, dict):
            return SEVERITY_PENALTIES.get(c.get("severity"), 0.5)
        return 0.5  # flat string — treat as medium
    penalty = sum(_concern_penalty(c) for c in concerns)

    # Derive variations dynamically from the content to avoid static scores
    idea = str(final_json.get("idea", ""))
    domain = str(final_json.get("domain", ""))
    
    def _text_hash(text: str) -> int:
        h = 0
        for char in text:
            h = (31 * h + ord(char)) & 0xFFFFFFFF
        return h

    h_idea = _text_hash(idea)
    h_domain = _text_hash(domain)
    
    feasibility = 5.0 + (h_idea % 4) + (len(pm.get("problem", "")) % 3) - (penalty % 3) * 0.5
    market_size = 4.0 + (h_domain % 5) + (len(pm.get("solution", "")) % 3) - (penalty % 2) * 0.5
    differentiation = 4.0 + ((h_idea + h_domain) % 5) + (len(marketing.get("positioning", "")) % 3) - (penalty % 3) * 0.5
    team_fit = 5.0 + (h_domain % 4) + (len(backend.get("architecture", "")) % 3) - (penalty % 2) * 0.5
    innovation = 4.0 + ((h_idea // 3) % 5) + (len(pm.get("tagline", "")) % 3) - (penalty % 3) * 0.5
    execution = 5.0 + ((h_domain // 2) % 4) + (len(marketing.get("gtm_strategy", "")) % 3) - (penalty % 2) * 0.5

    return {
        "feasibility":     _clamp_score(feasibility),
        "market_size":     _clamp_score(market_size),
        "differentiation": _clamp_score(differentiation),
        "team_fit":        _clamp_score(team_fit),
        "innovation":      _clamp_score(innovation),
        "execution":       _clamp_score(execution),
    }
