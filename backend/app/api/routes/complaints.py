"""Complaint management API routes.

Routes stay thin: parse request -> call service/AI -> map errors to HTTP.
See the module docstring contract at the top of the error-mapping table.
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.ai.graph.nodes.risk_node import risk_node
from app.ai.graph.nodes.validation_node import validation_node
from app.ai.graph.workflow import run_complaint_workflow
from app.ai.llm import LLMError
from app.config import MAX_UPLOAD_SIZE_BYTES
from app.db.base import get_db
from app.schemas.analysis import AnalyzeRequest, DuplicateCheckRequest
from app.schemas.complaint import ComplaintCreate, ComplaintRead
from app.services import complaint_service, document_service, duplicate_service

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

MB = 1024 * 1024


# ── AI intake ──────────────────────────────────────────────────────────

@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    """Upload a complaint document (PDF/DOCX/TXT/EML), get its raw text back."""
    # Reject oversized uploads before reading them into memory.
    if file.size is not None and file.size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum upload size is {MAX_UPLOAD_SIZE_BYTES // MB} MB.",
        )
    content = await file.read()
    try:
        text = document_service.extract_text(file.filename or "", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"filename": file.filename, "text": text, "char_count": len(text)}


@router.post("/analyze")
def analyze_complaint(payload: AnalyzeRequest):
    """Run the LangGraph workflow on complaint text (from upload or paste).

    Returns the full analysis: extraction, completeness, risk, recommendations.
    No response_model — the payload is already schema-validated inside the
    nodes; duplicating it here would add code without adding safety.
    """
    text = document_service.normalize_text(payload.text)
    try:
        return run_complaint_workflow(text)
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/check-duplicate")
def check_duplicate(payload: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """Compare draft complaint fields against saved complaints."""
    return duplicate_service.check_duplicates(db, payload.model_dump())


# ── CRUD ───────────────────────────────────────────────────────────────

@router.post("", status_code=201, response_model=ComplaintRead)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """Save a reviewed complaint. `customer_name` and `product_name` are required."""
    try:
        return complaint_service.create_complaint(db, payload)
    except Exception as exc:  # DB failures, constraint violations
        raise HTTPException(status_code=500, detail="Failed to save the complaint.") from exc


@router.get("", response_model=list[ComplaintRead])
def list_complaints(
    search: Optional[str] = Query(None, max_length=100),
    severity: Optional[Literal["Minor", "Major", "Critical"]] = None,
    priority: Optional[Literal["Low", "Medium", "High", "Urgent"]] = None,
    status: Optional[Literal["Open", "Under Investigation", "Closed"]] = None,
    product_type: Optional[Literal["API", "FDF"]] = None,
    db: Session = Depends(get_db),
):
    """List complaints. Literal filter params give free 422 validation."""
    return complaint_service.list_complaints(
        db, search=search, severity=severity, priority=priority,
        status=status, product_type=product_type,
    )


@router.get("/{complaint_id}", response_model=ComplaintRead)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = complaint_service.get_complaint(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found.")
    return complaint


# ── Per-complaint AI operations ────────────────────────────────────────

@router.post("/{complaint_id}/risk")
def recalculate_risk(complaint_id: int, db: Session = Depends(get_db)):
    """Re-run the risk node on a SAVED complaint and persist the result.

    Governance note: only the AI-owned fields (risk_score, risk_level,
    risk_factors) are persisted. severity/priority in the response are
    proposals only — overwriting the user's Section-4 decisions would be
    wrong, those fields belong to Quality personnel.
    """
    complaint = complaint_service.get_complaint(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found.")

    extraction = complaint_service.to_extraction_dict(complaint)
    try:
        result = risk_node({"extraction": extraction})
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    risk = result["risk"]
    complaint_service.update_complaint(db, complaint, {
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "risk_factors": risk["risk_factors"],
    })
    return risk


@router.post("/{complaint_id}/completeness")
def check_completeness(complaint_id: int, db: Session = Depends(get_db)):
    """Run the deterministic completeness check on a saved complaint."""
    complaint = complaint_service.get_complaint(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found.")

    extraction = complaint_service.to_extraction_dict(complaint)
    return validation_node({"extraction": extraction})["completeness"]