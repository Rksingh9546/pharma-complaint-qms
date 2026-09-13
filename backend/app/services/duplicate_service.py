"""Duplicate complaint detection.

Rule-based (not LLM) on purpose: it must be deterministic, explainable and
cheap. Weighted similarity score:

    batch number     40   (exact, case-insensitive)
    product name     20   (fuzzy ratio)
    customer name    15   (fuzzy ratio)
    description      25   (fuzzy ratio)
"""
from __future__ import annotations

from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from app.models import Complaint

DUPLICATE_MATCH_THRESHOLD = 50.0   # minimum score (%) to be listed as a match
MAX_MATCHES_RETURNED = 5

WEIGHTS = {"batch": 40.0, "product": 20.0, "customer": 15.0, "description": 25.0}


def check_duplicates(db: Session, draft: dict) -> dict:
    """Compare a draft complaint (any subset of fields) against all saved ones."""
    comparable = ("batch_number", "product_name", "customer_name", "description")
    if not any(_clean(draft.get(f)) for f in comparable):
        return {"max_similarity": 0, "matches": []}

    matches = []
    for existing in db.query(Complaint).all():
        score = _similarity(draft, existing)
        if score >= DUPLICATE_MATCH_THRESHOLD:
            matches.append({
                "id": existing.id,
                "complaint_number": existing.complaint_number,
                "customer_name": existing.customer_name,
                "product_name": existing.product_name,
                "batch_number": existing.batch_number,
                "severity": existing.severity,
                "status": existing.status,
                "similarity": round(score),
                "created_at": existing.created_at.isoformat() if existing.created_at else None,
            })

    matches.sort(key=lambda m: m["similarity"], reverse=True)
    max_similarity = matches[0]["similarity"] if matches else 0
    return {"max_similarity": max_similarity, "matches": matches[:MAX_MATCHES_RETURNED]}


# ── internals ─────────────────────────────────────────────────────────

def _similarity(draft: dict, existing: Complaint) -> float:
    score = 0.0

    draft_batch = _clean(draft.get("batch_number")).lower()
    if draft_batch and existing.batch_number:
        if draft_batch == existing.batch_number.strip().lower():
            score += WEIGHTS["batch"]

    if _clean(draft.get("product_name")) and existing.product_name:
        score += WEIGHTS["product"] * _ratio(draft["product_name"], existing.product_name)

    if _clean(draft.get("customer_name")) and existing.customer_name:
        score += WEIGHTS["customer"] * _ratio(draft["customer_name"], existing.customer_name)

    if _clean(draft.get("description")) and existing.description:
        score += WEIGHTS["description"] * _ratio(draft["description"], existing.description)

    return score


def _ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a.strip().lower(), b.strip().lower()).ratio()


def _clean(value) -> str:
    return str(value).strip() if value is not None else ""