"""Node 2 — Validate completeness (deterministic, rule-based, no LLM).

Completeness must be reproducible and auditable, so it is plain code.
"""
from __future__ import annotations

from app.ai.graph.state import ComplaintState

# (field key, human label) — order matches the complaint form sections
REQUIRED_CHECKS = [
    ("customer_name", "Customer"),
    ("customer_email", "Customer Email"),
    ("country", "Country"),
    ("complaint_received_date", "Complaint Received Date"),
    ("product_name", "Product"),
    ("product_type", "Product Type"),
    ("batch_number", "Batch Number"),
    ("manufacturing_date", "Manufacturing Date"),
    ("expiry_date", "Expiry Date"),
    ("quantity_affected", "Quantity Affected"),
    ("complaint_type", "Complaint Type"),
    ("complaint_date", "Complaint Date"),
    ("description", "Description"),
]


def validation_node(state: ComplaintState) -> dict:
    extraction = state.get("extraction", {})

    checks = []
    missing_labels = []
    for field, label in REQUIRED_CHECKS:
        value = extraction.get(field)
        present = value is not None and value != ""
        # note: value == 0 (quantity) still counts as present only via `!= 0` above;
        # booleans False are present too.
        checks.append({
            "field": field,
            "label": label,
            "status": "complete" if present else "missing",
        })
        if not present:
            missing_labels.append(label)

    percentage = round(100 * (len(REQUIRED_CHECKS) - len(missing_labels)) / len(REQUIRED_CHECKS))

    return {
        "completeness": {
            "percentage": percentage,
            "missing_fields": missing_labels,
            "checks": checks,
        }
    }