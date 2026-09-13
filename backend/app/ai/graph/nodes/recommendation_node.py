"""Node 4 — Recommended actions, CAPA assessment and complaint summary.

LLM proposal + deterministic guardrails:
  - HIGH/CRITICAL risk or adverse event forces capa.may_be_required = true
  - empty actions / summary get sensible deterministic fallbacks
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.ai.graph.state import ComplaintState
from app.ai.llm import call_llm_json


class Capa(BaseModel):
    may_be_required: bool = True
    root_cause_hypothesis: str = ""
    corrective_action: str = ""
    preventive_action: str = ""

    @field_validator("may_be_required", mode="before")
    @classmethod
    def _to_bool(cls, v):
        if isinstance(v, bool):
            return v
        return str(v).strip().lower() in {"true", "yes", "y", "1", "required"}

    @field_validator("root_cause_hypothesis", "corrective_action", "preventive_action",
                      mode="before")
    @classmethod
    def _clean(cls, v):
        return v.strip() if isinstance(v, str) else v


class Recommendations(BaseModel):
    recommended_actions: list[str] = Field(default_factory=list)
    capa: Capa = Field(default_factory=Capa)
    summary: str = ""

    @field_validator("recommended_actions", mode="before")
    @classmethod
    def _list_or_single(cls, v):
        return [v] if isinstance(v, str) else v


DEFAULT_ACTIONS = {
    "CRITICAL": [
        "Initiate QA investigation immediately (highest priority)",
        "Quarantine remaining stock of the affected batch",
        "Notify senior management and Quality Head",
        "Assess regulatory reporting obligations (e.g. product recall evaluation)",
    ],
    "HIGH": [
        "Initiate QA investigation",
        "Review affected batch manufacturing and packaging records",
        "Check for similar complaints on the same batch/product",
        "Evaluate CAPA requirement",
    ],
    "MEDIUM": [
        "Log and triage the complaint for QA review",
        "Verify batch documentation",
        "Monitor for similar complaints",
    ],
    "LOW": [
        "Log the complaint in the QMS",
        "Send acknowledgment to the customer",
    ],
}

PROMPT_TEMPLATE = """You are a pharmaceutical Quality Assurance advisor.
Based on the complaint data and risk assessment below, recommend next actions.

Respond with a single valid JSON object with exactly these keys:
recommended_actions, capa, summary

Where:
- recommended_actions: 4-6 concrete, professional QA next steps (array of strings).
- capa: an object with keys "may_be_required" (boolean), "root_cause_hypothesis"
  (most probable root cause based on the reported issue), "corrective_action",
  "preventive_action".
- summary: a short professional complaint summary (2-3 sentences) suitable for
  a QMS record — mention customer, product, batch and the issue.

Complaint data (extracted):
{extraction}

Risk assessment:
{risk}

Respond with a single valid JSON object now."""


def recommendation_node(state: ComplaintState) -> dict:
    extraction = state.get("extraction", {})
    risk = state.get("risk", {})
    prompt = PROMPT_TEMPLATE.format(extraction=extraction, risk=risk)
    result = call_llm_json(prompt, Recommendations)

    # ── deterministic guardrails ───────────────────────────────────────
    actions = [a.strip() for a in result.recommended_actions if a and a.strip()] or \
        DEFAULT_ACTIONS.get(risk.get("risk_level", "MEDIUM"), DEFAULT_ACTIONS["MEDIUM"])

    capa = result.capa
    if extraction.get("adverse_event") or risk.get("risk_level") in {"HIGH", "CRITICAL"}:
        capa = capa.model_copy(update={"may_be_required": True})

    summary = result.summary.strip() or _fallback_summary(extraction)

    return {
        "recommendations": {
            "recommended_actions": actions,
            "capa": capa.model_dump(),
            "summary": summary,
        }
    }


def _fallback_summary(extraction: dict) -> str:
    customer = extraction.get("customer_name") or "A customer"
    product = extraction.get("product_name") or "a pharmaceutical product"
    batch = f" (batch {extraction['batch_number']})" if extraction.get("batch_number") else ""
    issue = extraction.get("description") or "a product quality issue"
    return f"{customer} reported a complaint regarding {product}{batch}: {issue}"