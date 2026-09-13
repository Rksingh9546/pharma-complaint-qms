"""Groq LLM client with structured-output guardrails.

Every LLM call in this app goes through call_llm_json(), which enforces:
  1. Groq JSON mode (response_format)
  2. Tolerant parsing (strips markdown fences, extracts balanced JSON)
  3. Pydantic validation against the expected schema
  4. One retry with the validation error fed back to the model

Notes:
- Gemma models don't reliably support the 'system' role on Groq, so the
  full prompt (instructions + payload) is sent as a single user message.
- The word "JSON" must appear in prompts when JSON mode is enabled (Groq
  requirement) — all prompts below satisfy this.
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Type, TypeVar

from groq import Groq
from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Raised when the LLM is unavailable or returns unusable output."""


class _OutputInvalid(Exception):
    """Internal: model output was not parseable/validatable JSON."""


T = TypeVar("T", bound=BaseModel)

_client: Groq | None = None


def get_client() -> Groq:
    """Lazily create the Groq client (so the app can start without a key)."""
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def call_llm_json(
    prompt: str,
    schema_model: Type[T],
    *,
    temperature: float = 0.0,   # 0 for reproducibility — a QMS requirement
    max_tokens: int = 2000,
) -> T:
    """Call Groq and return output validated against a Pydantic schema.

    Retries once for bad output (with the error appended to the prompt) and
    once for transient API errors. Raises LLMError if no valid output.
    """
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY is not configured on the server. Add it to backend/.env.")

    current_prompt = prompt
    last_issue = "unknown"

    for attempt in (1, 2):
        try:
            response = get_client().chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": current_prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},   # guardrail 1
            )
            content = response.choices[0].message.content or ""
            data = parse_json_tolerant(content)            # guardrail 2
            if not isinstance(data, dict):
                raise _OutputInvalid("Response did not contain a JSON object.")
            return schema_model.model_validate(data)       # guardrail 3

        except _OutputInvalid as exc:
            last_issue = str(exc)
        except ValidationError as exc:
            last_issue = f"schema validation failed: {exc.errors()[:3]}"
        except _OutputInvalid | ValidationError:
            continue
        except Exception as exc:                            # network / API errors
            if attempt == 1:
                logger.warning("Groq API error (%s) — retrying once.", exc)
                time.sleep(1)
                continue
            raise LLMError(f"Groq API call failed: {exc}") from exc

        # guardrail 4: retry with error feedback
        logger.warning("LLM output invalid (attempt %d): %s", attempt, last_issue)
        current_prompt = (
            f"{prompt}\n\nYour previous response was invalid ({last_issue}). "
            "Respond again with a single valid JSON object matching the schema exactly."
        )

    raise LLMError(f"The AI model returned invalid output twice ({last_issue}).")


def parse_json_tolerant(content: str) -> Any:
    """Parse model output as JSON, tolerating markdown fences and stray text."""
    text = content.strip()

    # Strip ```json ... ``` fences
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract the first balanced {...} block from surrounding text
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None