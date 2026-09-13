"""LangGraph workflow — builds and compiles the complaint analysis graph.

START -> extract -> validate -> assess_risk -> recommend -> finalize -> END

Error strategy: LLM failures raise LLMError out of run_complaint_workflow();
the API layer (Step 4) maps that to a clean 502. The workflow never returns
partial/fabricated analysis.
"""
from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.ai.graph.nodes.extract_node import extract_node
from app.ai.graph.nodes.final_node import final_node
from app.ai.graph.nodes.recommendation_node import recommendation_node
from app.ai.graph.nodes.risk_node import risk_node
from app.ai.graph.nodes.validation_node import validation_node
from app.ai.graph.state import ComplaintState


def build_workflow():
    graph = StateGraph(ComplaintState)

    graph.add_node("extract_complaint", extract_node)
    graph.add_node("validate_completeness", validation_node)
    graph.add_node("assess_risk", risk_node)
    graph.add_node("generate_recommendations", recommendation_node)
    graph.add_node("finalize_response", final_node)

    graph.add_edge(START, "extract_complaint")
    graph.add_edge("extract_complaint", "validate_completeness")
    graph.add_edge("validate_completeness", "assess_risk")
    graph.add_edge("assess_risk", "generate_recommendations")
    graph.add_edge("generate_recommendations", "finalize_response")
    graph.add_edge("finalize_response", END)

    return graph.compile()


# Compiled once at import — reused for every request.
complaint_workflow = build_workflow()


def run_complaint_workflow(text: str) -> dict:
    """Run the full analysis workflow on complaint text. Returns state['final']."""
    if not text or not text.strip():
        raise ValueError("Complaint text is empty.")
    state = complaint_workflow.invoke({"raw_text": text})
    return state["final"]