"""Gemini model call helpers for Person A agents."""

from __future__ import annotations

import json
import os
import re
from typing import Any

from . import prompts

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


class AgentCallError(RuntimeError):
    """Raised when a Gemini response cannot be produced or parsed."""


def _api_key_for(agent_name: str | None) -> str:
    if agent_name:
        specific_key = os.getenv(f"GEMINI_{agent_name.upper()}_API_KEY")
        if specific_key:
            return specific_key

    shared_key = os.getenv("GEMINI_API_KEY")
    if shared_key:
        return shared_key

    raise AgentCallError(
        "Missing Gemini API key. Set GEMINI_API_KEY or GEMINI_<AGENT>_API_KEY."
    )


def _extract_json(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise AgentCallError("Gemini response did not contain JSON.")
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise AgentCallError("Gemini response JSON must be an object.")
    return parsed


def call_agent(
    system_prompt: str,
    input_json: dict[str, Any],
    *,
    agent_name: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
) -> dict[str, Any]:
    """Call Gemini for one agent and return parsed JSON."""

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise AgentCallError(
            "google-genai is required for Gemini calls. Install google-genai."
        ) from exc

    client = genai.Client(api_key=api_key or _api_key_for(agent_name))
    response = client.models.generate_content(
        model=model or DEFAULT_MODEL,
        contents=json.dumps(input_json, ensure_ascii=True),
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )

    if not response.text:
        raise AgentCallError("Gemini returned an empty response.")
    return _extract_json(response.text)


def classify_domain(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(
        prompts.DOMAIN_CLASSIFIER_PROMPT,
        input_json,
        agent_name="domain_classifier",
    )


def run_pm(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.PM_AGENT_PROMPT, input_json, agent_name="pm")


def run_ui(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.UI_AGENT_PROMPT, input_json, agent_name="ui")


def run_backend(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.BACKEND_AGENT_PROMPT, input_json, agent_name="backend")


def run_marketing(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.MARKETING_AGENT_PROMPT, input_json, agent_name="marketing")


def run_investor(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.INVESTOR_AGENT_PROMPT, input_json, agent_name="investor")


def run_skeptic(input_json: dict[str, Any]) -> dict[str, Any]:
    return call_agent(prompts.SKEPTIC_AGENT_PROMPT, input_json, agent_name="skeptic")


def revise_agent(agent_name: str, input_json: dict[str, Any]) -> dict[str, Any]:
    prompt = prompts.REVISION_PROMPTS[agent_name]
    return call_agent(prompt, input_json, agent_name=agent_name)
