"""SQLAlchemy model for the complaints table."""

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects import postgresql

from app.db.base import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    # Section 1 — Origin & customer details
    source = Column(String(100))
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255))
    country = Column(String(100))
    complaint_received_date = Column(Date)

    # Section 2 — Product & batch identification
    product_name = Column(String(255), nullable=False)
    product_type = Column(String(10))  # API or FDF
    strength = Column(String(100))
    batch_number = Column(String(100), index=True)
    manufacturing_date = Column(Date)
    expiry_date = Column(Date)
    quantity_affected = Column(Integer)
    unit = Column(String(50))

    # Section 3 — Complaint details
    complaint_type = Column(String(100))
    complaint_date = Column(Date)
    description = Column(Text)

    # Section 4 — Initial assessment
    severity = Column(String(20))
    priority = Column(String(20))
    investigation_required = Column(
        Boolean,
        default=False,
        nullable=False,
    )
    adverse_event = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    # AI-generated fields
    risk_score = Column(Integer)
    risk_level = Column(String(20))  # LOW, MEDIUM, HIGH, CRITICAL
    ai_summary = Column(Text)

    # Supports PostgreSQL JSONB and SQLite JSON (for tests)
    ai_recommendation = Column(
        JSON().with_variant(postgresql.JSONB(), "postgresql")
    )
    risk_factors = Column(JSON)

    status = Column(
        String(20),
        default="Open",
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )