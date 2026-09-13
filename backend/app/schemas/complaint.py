"""Pydantic schemas for complaint requests/responses.

Design note: this schema is deliberately TOLERANT on input (empty strings
become None, product_type variants are normalized) because the data comes
from LLM extraction and user editing. The strict schema lives in the AI
extraction layer (Step 3).
"""
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _blank_to_none(value):
    """Treat empty/whitespace-only strings as missing."""
    if isinstance(value, str) and not value.strip():
        return None
    return value


class ComplaintBase(BaseModel):
    """Fields shared by create & read payloads."""

    # Section 1 — Origin & customer details
    source: Optional[str] = Field(None, max_length=100)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    complaint_received_date: Optional[date] = None

    # Section 2 — Product & batch identification
    product_name: str = Field(..., min_length=1, max_length=255)
    product_type: Optional[str] = None
    strength: Optional[str] = Field(None, max_length=100)
    batch_number: Optional[str] = Field(None, max_length=100)
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_affected: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)

    # Section 3 — Complaint details
    complaint_type: Optional[str] = Field(None, max_length=100)
    complaint_date: Optional[date] = None
    description: Optional[str] = None

    # Section 4 — Initial assessment
    severity: Optional[str] = Field(None, max_length=20)
    priority: Optional[str] = Field(None, max_length=20)
    investigation_required: bool = False
    adverse_event: bool = False

    # AI-generated fields (persisted with the complaint)
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    risk_level: Optional[str] = Field(None, max_length=20)
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[dict[str, Any]] = None
    risk_factors: Optional[list[str]] = None

    # ── Normalization ─────────────────────────────────────────────────
    @field_validator(
        "source", "customer_email", "country", "product_type", "strength",
        "batch_number", "unit", "complaint_type", "severity", "priority",
        "risk_level", "customer_name", "product_name",
        mode="before",
    )
    @classmethod
    def strings_blank_to_none(cls, v):
        return _blank_to_none(v)

    @field_validator(
        "complaint_received_date", "manufacturing_date", "expiry_date",
        "complaint_date", "quantity_affected",
        mode="before",
    )
    @classmethod
    def optional_fields_blank_to_none(cls, v):
        # "" for a date/int would otherwise fail parsing; treat as missing
        return _blank_to_none(v)

    @field_validator("product_type", mode="before")
    @classmethod
    def normalize_product_type(cls, v):
        v = _blank_to_none(v)
        if v is None:
            return None
        lowered = str(v).strip().lower()
        if "finished" in lowered or lowered == "fdf":
            return "FDF"
        if "active" in lowered or lowered == "api":
            return "API"
        return str(v).strip()


class ComplaintCreate(ComplaintBase):
    """Payload for POST /api/complaints."""
    status: Optional[str] = Field("Open", max_length=20)


class ComplaintRead(ComplaintBase):
    """A complaint as stored in the DB (used for list & detail responses)."""
    id: int
    complaint_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)   # ORM -> Pydantic
    