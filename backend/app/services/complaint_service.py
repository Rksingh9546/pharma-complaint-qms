"""Complaint persistence service (create / get / list / update)."""
from __future__ import annotations

from datetime import date
from typing import Any, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Complaint
from app.schemas.complaint import ComplaintCreate


def create_complaint(db: Session, data: ComplaintCreate) -> Complaint:
    complaint = Complaint(**data.model_dump())
    complaint.complaint_number = _next_complaint_number(db)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


def get_complaint(db: Session, complaint_id: int) -> Optional[Complaint]:
    return db.get(Complaint, complaint_id)


def list_complaints(
    db: Session,
    search: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    product_type: Optional[str] = None,
) -> list[Complaint]:
    query = db.query(Complaint)

    if search:
        like = f"%{search.strip()}%"
        query = query.filter(or_(
            Complaint.complaint_number.ilike(like),
            Complaint.customer_name.ilike(like),
            Complaint.product_name.ilike(like),
            Complaint.batch_number.ilike(like),
            Complaint.description.ilike(like),
        ))
    if severity:
        query = query.filter(Complaint.severity == severity)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if status:
        query = query.filter(Complaint.status == status)
    if product_type:
        query = query.filter(Complaint.product_type == product_type)

    return query.order_by(Complaint.created_at.desc()).all()


def update_complaint(db: Session, complaint: Complaint, changes: dict[str, Any]) -> Complaint:
    """Update only the provided fields. `updated_at` bumps automatically (onupdate)."""
    for field, value in changes.items():
        if hasattr(complaint, field) and field != "id":
            setattr(complaint, field, value)
    db.commit()
    db.refresh(complaint)
    return complaint


def _next_complaint_number(db: Session) -> str:
    """Next sequential number for the current year, e.g. CC-2025-0007."""
    prefix = f"CC-{date.today().year}-"
    rows = (
        db.query(Complaint.complaint_number)
        .filter(Complaint.complaint_number.like(f"{prefix}%"))
        .all()
    )
    sequences = [
        int(number.rsplit("-", 1)[-1])
        for (number,) in rows
        if number.rsplit("-", 1)[-1].isdigit()
    ]
    next_seq = max(sequences) + 1 if sequences else 1
    return f"{prefix}{next_seq:04d}"

def to_extraction_dict(complaint: Complaint) -> dict:
    """Map a stored complaint row to the extraction-dict shape used by the
    AI nodes (risk recalculation, completeness checks on saved complaints)."""
    def iso(value):
        return value.isoformat() if value else None

    return {
        "complaint_source": complaint.source,
        "customer_name": complaint.customer_name,
        "customer_email": complaint.customer_email,
        "country": complaint.country,
        "complaint_received_date": iso(complaint.complaint_received_date),
        "product_name": complaint.product_name,
        "product_type": complaint.product_type,
        "strength": complaint.strength,
        "batch_number": complaint.batch_number,
        "manufacturing_date": iso(complaint.manufacturing_date),
        "expiry_date": iso(complaint.expiry_date),
        "quantity_affected": complaint.quantity_affected,
        "unit": complaint.unit,
        "complaint_type": complaint.complaint_type,
        "complaint_date": iso(complaint.complaint_date),
        "description": complaint.description,
        "severity": complaint.severity,
        "priority": complaint.priority,
        "investigation_required": complaint.investigation_required,
        "adverse_event": complaint.adverse_event,
    }