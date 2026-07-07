"""Domain classification entry point for raw startup ideas."""

from __future__ import annotations

from typing import Any

from .agents import classify_domain


def detect_domain(idea: str) -> dict[str, Any]:
    """Return domain context to inject into every downstream prompt."""

    return classify_domain({"idea": idea.strip()})
