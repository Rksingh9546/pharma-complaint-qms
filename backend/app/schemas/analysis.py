"""Request schemas for AI-analysis endpoints."""
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.config import MAX_TEXT_CHARS_FOR_LLM

MIN_ANALYSIS_CHARS = 10


class AnalyzeRequest(BaseModel):
    """Body of POST /api/complaints/analyze."""
    text: str = Field(..., max_length=MAX_TEXT_CHARS_FOR_LLM)

    @field_validator("text")
    @classmethod
    def _usable_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Complaint text must not be empty.")
        if len(v) < MIN_ANALYSIS_CHARS:
            raise ValueError(
                f"Complaint text is too short to analyze "
                f"(minimum {MIN_ANALYSIS_CHARS} characters)."
            )
        return v


class DuplicateCheckRequest(BaseModel):
    """Body of POST /api/complaints/check-duplicate — any subset of fields."""
    batch_number: Optional[str] = Field(None, max_length=100)
    product_name: Optional[str] = Field(None, max_length=255)
    customer_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None

    @field_validator("batch_number", "product_name", "customer_name", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v.strip() if isinstance(v, str) else v