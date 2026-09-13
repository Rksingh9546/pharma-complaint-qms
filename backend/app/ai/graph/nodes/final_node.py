"""Node 5 — Assemble the final structured response (deterministic)."""
from __future__ import annotations

from app.ai.graph.state import ComplaintState

DISCLAIMER = (
    "AI-assisted recommendation. Final quality decisions must be made by "
    "authorized Quality personnel."
)


def final_node(state: ComplaintState) -> dict:
    return {
        "final": {
            "extraction": state.get("extraction", {}),
            "completeness": state.get("completeness", {}),
            "risk": state.get("risk_assessment", {}),
            "recommendations": state.get("recommendations", {}),
            "disclaimer": DISCLAIMER,
        }
    }