"""
agents.py — DeepSeek V3 API caller for the Master AI Co-Founder Orchestrator.
Consolidates all 6 agents' outputs into a single, high-quality JSON call.
"""

from __future__ import annotations

import json
import os
import re
import asyncio
import httpx
from typing import Any

from . import prompts

MAX_RETRIES = 5
RETRY_CODES = {429, 500, 502, 503, 504}


class AgentCallError(RuntimeError):
    """Raised when a model response cannot be produced or parsed."""


def _extract_json(raw_text: str) -> dict[str, Any]:
    """Clean markdown code fences from the JSON output if present."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise AgentCallError("Response did not contain valid JSON.")
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise AgentCallError("Response JSON must be an object.")
    return parsed


async def call_deepseek_agent(
    system_prompt: str,
    input_json: dict[str, Any],
) -> dict[str, Any]:
    """Call DeepSeek API asynchronously for the master agent and return parsed JSON."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise AgentCallError("Missing DEEPSEEK_API_KEY. Set it in backend/.env.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(input_json, ensure_ascii=True)},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
    }

    last_exc: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # High timeout since generating the complete startup plan can take 15-45s
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://api.deepseek.com/chat/completions",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                resp_data = response.json()
                choices = resp_data.get("choices", [])
                if not choices:
                    raise AgentCallError("DeepSeek returned empty choices.")
                content = choices[0].get("message", {}).get("content", "")
                if not content:
                    raise AgentCallError("DeepSeek returned empty content.")
                return _extract_json(content)
        except Exception as exc:
            last_exc = exc
            error_str = str(exc)
            
            # Check for HTTP status codes that are retryable
            status_code = None
            if isinstance(exc, httpx.HTTPStatusError):
                status_code = exc.response.status_code
                
            retryable = (
                (status_code in RETRY_CODES) or 
                isinstance(exc, (httpx.ConnectError, httpx.TimeoutException))
            )
            
            if retryable and attempt < MAX_RETRIES:
                wait = 2 ** attempt  # 2s, 4s, 8s, 16s
                print(f"[DeepSeek Retry {attempt}/{MAX_RETRIES}] Error: {exc}. Retrying in {wait}s...")
                await asyncio.sleep(wait)
            else:
                raise AgentCallError(f"DeepSeek call failed: {exc}") from exc

    raise AgentCallError(f"Failed after {MAX_RETRIES} retries.") from last_exc


async def run_master_agent(idea: str) -> dict[str, Any]:
    """Execute the complete virtual co-founder analysis for a startup idea."""
    return await call_deepseek_agent(prompts.MASTER_AGENT_PROMPT, {"idea": idea})
