from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db.base import get_db

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Reports service status, DB connectivity, and whether Groq is configured."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": settings.app_name,
        "database": db_status,
        "groq_configured": bool(settings.groq_api_key),
    }