"""Normalize live Gemini agent JSON into the frontend display contract."""

from __future__ import annotations

import re
from typing import Any

# Named colors → hex for wireframe CSS
_COLOR_MAP = {
    "indigo": "#6366F1",
    "purple": "#7C3AED",
    "violet": "#8B5CF6",
    "blue": "#3B82F6",
    "sky": "#0EA5E9",
    "cyan": "#06B6D4",
    "teal": "#14B8A6",
    "emerald": "#10B981",
    "green": "#22C55E",
    "lime": "#84CC16",
    "amber": "#F59E0B",
    "orange": "#F97316",
    "red": "#EF4444",
    "rose": "#F43F5E",
    "pink": "#EC4899",
    "slate": "#64748B",
    "gray": "#6B7280",
    "white": "#FFFFFF",
    "black": "#000000",
}


def _as_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [value]
    return [value]


def _flatten_critique_item(item: Any) -> str:
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        issue = item.get("issue", "")
        severity = item.get("severity", "")
        agent = item.get("agent", "")
        revision = item.get("recommended_revision", "")
        prefix_parts = []
        if severity:
            prefix_parts.append(f"[{severity}]")
        if agent:
            prefix_parts.append(f"({agent})")
        text = " ".join(prefix_parts)
        text = f"{text} {issue}".strip() if text else issue
        if revision:
            text = f"{text} → {revision}"
        return text or str(item)
    return str(item)


def _resolve_color(value: Any, default: str = "#6366F1") -> str:
    if not value or not isinstance(value, str):
        return default
    value = value.strip()
    if re.match(r"^#[0-9A-Fa-f]{3,8}$", value):
        return value
    lower = value.lower()
    if lower in _COLOR_MAP:
        return _COLOR_MAP[lower]
    for name, hex_val in _COLOR_MAP.items():
        if name in lower:
            return hex_val
    return default


def _resolve_font(value: Any, default: str = "Inter") -> str:
    if not value or not isinstance(value, str):
        return default
    # Strip prose like "Clean sans-serif using Inter"
    match = re.search(
        r"\b(Inter|Roboto|Open Sans|Lato|Poppins|Montserrat|Nunito|Source Sans|DM Sans|Manrope|Outfit)\b",
        value,
        re.I,
    )
    if match:
        return match.group(1)
    if len(value) <= 30 and not any(c in value for c in ".,"):
        return value.split()[0] if value.split() else default
    return default


def _normalize_design_system(ui: dict[str, Any]) -> dict[str, Any]:
    ds = ui.get("design_system") or {}
    vs = ui.get("visual_style") or {}
    colors = vs.get("colors") or ds.get("colors") or []
    if not isinstance(colors, list):
        colors = [colors] if colors else []

    primary = (
        ds.get("primary_color")
        or ds.get("primary")
        or (colors[0] if colors else None)
    )
    accent = ds.get("accent_color") or ds.get("accent") or (colors[1] if len(colors) > 1 else None)
    font = ds.get("font") or vs.get("typography") or "Inter"

    return {
        "primary_color": _resolve_color(primary),
        "primary": _resolve_color(primary),
        "accent_color": _resolve_color(accent, "#10B981"),
        "accent": _resolve_color(accent, "#10B981"),
        "font": _resolve_font(font),
        "style": ds.get("style") or vs.get("tone") or "Modern SaaS",
        "theme": ds.get("theme") or vs.get("tone") or "Dark mode",
    }


def _normalize_screens(ui: dict[str, Any]) -> list[dict[str, Any]]:
    raw = ui.get("screens") or []
    normalized: list[dict[str, Any]] = []

    for idx, screen in enumerate(raw):
        if isinstance(screen, str):
            normalized.append(
                {"name": screen, "components": [f"{screen} panel", "Action controls"]}
            )
            continue
        if not isinstance(screen, dict):
            continue

        name = screen.get("name") or f"Screen {idx + 1}"
        components = (
            screen.get("components")
            or screen.get("key_components")
            or ([screen["purpose"]] if screen.get("purpose") else [])
            or [f"{name} module"]
        )
        normalized.append({"name": name, "components": _as_list(components)})

    return normalized


def normalize_pm(pm: dict[str, Any]) -> dict[str, Any]:
    if not pm:
        return pm
    result = dict(pm)
    result["core_features"] = pm.get("core_features") or pm.get("mvp_features") or []
    result["roadmap"] = pm.get("roadmap") or pm.get("user_journey") or []
    result["mvp_scope"] = pm.get("mvp_scope") or (
        ", ".join(_as_list(pm.get("mvp_features"))[:3]) if pm.get("mvp_features") else None
    )
    result["target_users"] = _as_list(pm.get("target_users") or pm.get("target_user"))
    return result


def normalize_ui(ui: dict[str, Any]) -> dict[str, Any]:
    if not ui:
        return ui
    design_system = _normalize_design_system(ui)
    screens = _normalize_screens(ui)
    flows = (
        ui.get("key_user_flows")
        or ui.get("key_interactions")
        or ui.get("wireframe_notes")
        or []
    )
    notes = ui.get("wireframe_notes") or []

    result = dict(ui)
    result["design_system"] = design_system
    result["visual_style"] = ui.get("visual_style") or design_system
    result["screens"] = screens
    result["key_user_flows"] = _as_list(flows)
    result["key_interactions"] = _as_list(ui.get("key_interactions") or flows)
    result["wireframe_notes"] = _as_list(notes)
    result["component_library"] = ui.get("component_library") or "Tailwind CSS + Radix UI"
    return result


def normalize_backend(backend: dict[str, Any]) -> dict[str, Any]:
    if not backend:
        return backend
    result = dict(backend)
    endpoints = backend.get("api_endpoints") or backend.get("key_endpoints") or []
    normalized_eps: list[str] = []
    for ep in endpoints:
        if isinstance(ep, str):
            normalized_eps.append(ep)
        elif isinstance(ep, dict):
            method = ep.get("method", "GET")
            path = ep.get("path", "")
            purpose = ep.get("purpose", "")
            line = f"{method} {path}".strip()
            if purpose:
                line = f"{line} — {purpose}"
            normalized_eps.append(line)
    result["api_endpoints"] = normalized_eps

    if not result.get("tech_stack") and result.get("tech_choices"):
        choices = result["tech_choices"]
        if isinstance(choices, dict):
            result["tech_stack"] = list(choices.values())
    return result


def normalize_marketing(marketing: dict[str, Any]) -> dict[str, Any]:
    if not marketing:
        return marketing
    result = dict(marketing)
    messaging = marketing.get("messaging")
    if isinstance(messaging, dict):
        tagline = messaging.get("tagline", "")
        pitch = messaging.get("elevator_pitch", "")
        result["messaging"] = " — ".join(p for p in [tagline, pitch] if p) or str(messaging)
    result["gtm_strategy"] = marketing.get("gtm_strategy") or (
        "; ".join(_as_list(marketing.get("launch_plan"))) if marketing.get("launch_plan") else None
    )
    result["competitive_positioning"] = (
        marketing.get("competitive_positioning") or marketing.get("positioning")
    )
    result["channels"] = _as_list(marketing.get("channels"))
    if not result.get("target_cac"):
        result["target_cac"] = marketing.get("target_cac") or "TBD"
    if not result.get("target_ltv"):
        result["target_ltv"] = marketing.get("target_ltv") or "TBD"
    return result


def normalize_critique(critique: dict[str, Any]) -> dict[str, Any]:
    if not critique:
        return critique
    result = dict(critique)
    result["investor_concerns"] = [
        _flatten_critique_item(c) for c in critique.get("investor_concerns", [])
    ]
    result["skeptic_flags"] = [
        _flatten_critique_item(f) for f in critique.get("skeptic_flags", [])
    ]
    return result


def normalize_round1(round1: dict[str, Any]) -> dict[str, Any]:
    if not round1:
        return round1
    return {
        "pm": normalize_pm(round1.get("pm") or {}),
        "ui": normalize_ui(round1.get("ui") or {}),
        "backend": normalize_backend(round1.get("backend") or {}),
        "marketing": normalize_marketing(round1.get("marketing") or {}),
    }


def normalize_pipeline_output(state: dict[str, Any]) -> dict[str, Any]:
    """Normalize full pipeline state for frontend consumption."""
    result = dict(state)
    if result.get("round1"):
        result["round1"] = normalize_round1(result["round1"])
    if result.get("round2_critique"):
        result["round2_critique"] = normalize_critique(result["round2_critique"])
    return result
