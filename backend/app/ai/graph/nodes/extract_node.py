"""Node 1 — Extract structured complaint information from raw text.

LLM node (gemma2-9b-it). Output is validated against ExtractedComplaint,
which also normalizes: dates -> ISO strings, product_type variants ->
API/FDF, quantity strings ("approx. 250 packs") -> int, booleans, enums.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.ai.graph.state import ComplaintState
from app.ai.llm import call_llm_json

FIELDS = [
    "complaint_source", "customer_name", "customer_email", "country",
    "complaint_received_date", "product_name", "product_type", "strength",
    "batch_number", "manufacturing_date", "expiry_date", "quantity_affected",
    "unit", "complaint_type", "complaint_date", "description", "severity",
    "priority", "investigation_required", "adverse_event",
]

SEVERITIES = ["Minor", "Major", "Critical"]
PRIORITIES = ["Low", "Medium", "High", "Urgent"]

_DATE_FORMATS = (
    "%Y-%m-%d", "%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y",
    "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y", "%m/%d/%Y",
)
_NULLISH = {"", "n/a", "na", "none", "null", "unknown", "not mentioned", "not specified"}


class ExtractedComplaint(BaseModel):
    """Strict contract for the 20 form fields the LLM must return."""
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    country: Optional[str] = None
    complaint_received_date: Optional[date] = None
    product_name: Optional[str] = None
    product_type: Optional[str] = None
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_affected: Optional[int] = None
    unit: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[date] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    investigation_required: bool = False
    adverse_event: bool = False

    # ── normalizers ────────────────────────────────────────────────────
    @field_validator(
        "complaint_source", "customer_name", "customer_email", "country",
        "product_name", "strength", "batch_number", "unit",
        "complaint_type", "description", mode="before",
    )
    @classmethod
    def _clean_str(cls, v):
        if not isinstance(v, str):
            return v
        s = v.strip()
        return None if s.lower() in _NULLISH else s or None

    @field_validator(
        "complaint_received_date", "manufacturing_date", "expiry_date",
        "complaint_date", mode="before",
    )
    @classmethod
    def _to_date(cls, v):
        if v in (None, "") or isinstance(v, date):
            return v
        s = str(v).strip()
        for fmt in _DATE_FORMATS:
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        return None   # unparseable date is dropped, not faked

    @field_validator("quantity_affected", mode="before")
    @classmethod
    def _to_int(cls, v):
        if v in (None, "") or isinstance(v, bool):
            return None
        if isinstance(v, int):
            return v
        match = re.search(r"\d+", str(v).replace(",", ""))
        return int(match.group()) if match else None

    @field_validator("investigation_required", "adverse_event", mode="before")
    @classmethod
    def _to_bool(cls, v):
        if isinstance(v, bool):
            return v
        return str(v).strip().lower() in {"true", "yes", "y", "1", "required", "suspected"}

    @field_validator("product_type", mode="before")
    @classmethod
    def _normalize_product_type(cls, v):
        v = cls._clean_str(v)
        if v is None:
            return None
        s = v.lower()
        if "finished" in s or s == "fdf":
            return "FDF"
        if "active pharmaceutical" in s or s == "api":
            return "API"
        return None   # unrecognized value is dropped, not guessed

    @field_validator("severity", mode="before")
    @classmethod
    def _normalize_severity(cls, v):
        return _match_choice(v, SEVERITIES)

    @field_validator("priority", mode="before")
    @classmethod
    def _normalize_priority(cls, v):
        return _match_choice(v, PRIORITIES)


def _match_choice(value, allowed):
    if value is None:
        return None
    s = str(value).strip().lower()
    for option in allowed:
        if s == option.lower() or s.startswith(option.lower()):
            return option
    return None


# ── prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = f"""You are a pharmaceutical Quality Assurance data-extraction specialist.
Extract customer complaint information into structured JSON.

Respond with a single valid JSON object with EXACTLY these keys:
{", ".join(FIELDS)}

Extraction rules:
- Use null for any value not stated in the text. NEVER invent or guess values.
- Dates in ISO format YYYY-MM-DD. If a date is partial (e.g. only a year), use null.
- product_type: "API" (Active Pharmaceutical Ingredient) or "FDF" (Finished Dosage Form) only.
- quantity_affected: an integer only (e.g. 250). Put the unit separately in "unit"
  (e.g. "packs", "kg", "vials", "bottles").
- severity: "Minor", "Major" or "Critical".
- priority: "Low", "Medium", "High" or "Urgent".
- investigation_required / adverse_event: JSON booleans (true/false).
- complaint_source examples: "Email", "Phone", "Letter", "Distributor",
  "Regulatory Authority", "Internal", "Other".
- complaint_type examples: "Physical Defect", "Packaging Defect", "Labeling Error",
  "Contamination", "Potency/Assay Failure", "Stability Issue", "Documentation Error",
  "Adverse Event", "Other".
- description: 2-4 factual sentences summarizing the complaint as reported.
- The text may be an email whose From/Subject/Date headers contain the customer
  and dates — use them.

The complaint text is provided between triple quotes. Respond with JSON only."""


def extract_node(state: ComplaintState) -> dict:
    """LangGraph node: raw_text -> extraction."""
    text = state["raw_text"]
    prompt = (
        f"{SYSTEM_PROMPT}\n\nComplaint text:\n\"\"\"\n{text}\n\"\"\"\n\n"
        "Respond with a single valid JSON object now."
    )
    result = call_llm_json(prompt, ExtractedComplaint)
    # mode="json" -> dates become ISO strings, ready for the API response
    return {"extraction": result.model_dump(mode="json")}