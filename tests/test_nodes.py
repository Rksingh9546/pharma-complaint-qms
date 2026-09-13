"""Node tests — the LLM boundary (call_llm_json) is mocked, so these run
without Groq and verify normalization + the deterministic guardrails."""
from app.ai.graph.nodes.extract_node import extract_node
from app.ai.graph.nodes.final_node import final_node
from app.ai.graph.nodes.risk_node import risk_node
from app.ai.graph.nodes.validation_node import validation_node


# ── validation_node (pure logic) ──────────────────────────────────────

def test_validation_counts_missing_fields():
    result = validation_node({"extraction": {"customer_name": "ABC",
                                             "product_name": "Paracetamol"}})
    completeness = result["completeness"]
    assert completeness["percentage"] == round(100 * 2 / 13)
    labels = {c["label"] for c in completeness["checks"]}
    assert "Batch Number" in labels
    assert "Customer" in {c["label"] for c in completeness["checks"]}


# ── extract_node (mocked LLM; checks the Pydantic normalization layer) ─

def test_extract_node_normalizes_llm_output(monkeypatch):
    from app.ai.graph.nodes import extract_node as mod

    def fake_llm(prompt, schema, **kwargs):
        return schema.model_validate({
            "customer_name": "ABC Healthcare",
            "product_type": "Finished Dosage Form",     # -> FDF
            "quantity_affected": "approx. 250",          # -> 250
            "adverse_event": "no",                       # -> False
            "complaint_received_date": "10 November 2025",  # -> ISO date
        })

    monkeypatch.setattr(mod, "call_llm_json", fake_llm)
    extraction = extract_node({"raw_text": "irrelevant — LLM is mocked"})["extraction"]

    assert extraction["product_type"] == "FDF"
    assert extraction["quantity_affected"] == 250
    assert extraction["adverse_event"] is False
    assert extraction["complaint_received_date"] == "2025-11-10"  # ISO for JSON response


def test_extract_node_drops_garbage_product_type(monkeypatch):
    from app.ai.graph.nodes import extract_node as mod

    def fake_llm(prompt, schema, **kwargs):
        return schema.model_validate({"product_type": "tablet thing"})

    monkeypatch.setattr(mod, "call_llm_json", fake_llm)
    extraction = extract_node({"raw_text": "x"})["extraction"]
    assert extraction["product_type"] is None  # unrecognized value is dropped, not guessed


# ── risk_node (mocked LLM; checks the deterministic guardrails) ───────

def test_risk_node_forces_high_for_adverse_event(monkeypatch):
    from app.ai.graph.nodes import risk_node as mod

    def fake_llm(prompt, schema, **kwargs):
        return schema.model_validate({
            "risk_level": "MEDIUM", "risk_score": 50, "confidence": 80,
            "severity": "Major", "priority": "Medium",
            "risk_factors": ["x"], "explanation": "y",
        })

    monkeypatch.setattr(mod, "call_llm_json", fake_llm)
    risk = risk_node({"extraction": {"adverse_event": True}})["risk"]
    assert risk["risk_level"] == "HIGH"      # guardrail escalated it
    assert risk["risk_score"] >= 65          # clamped into the HIGH band


def test_risk_node_clamps_score_into_band(monkeypatch):
    from app.ai.graph.nodes import risk_node as mod

    def fake_llm(prompt, schema, **kwargs):
        return schema.model_validate({
            "risk_level": "LOW", "risk_score": 90, "confidence": 70,
            "severity": "Minor", "priority": "Low",
        })

    monkeypatch.setattr(mod, "call_llm_json", fake_llm)
    risk = risk_node({"extraction": {}})["risk"]
    assert risk["risk_score"] <= 39          # LOW band is 0-39


# ── final_node (pure logic) ────────────────────────────────────────────

def test_final_node_assembles_response_with_disclaimer():
    state = {"extraction": {"a": 1}, "completeness": {"percentage": 50},
             "risk": {"risk_level": "LOW"}, "recommendations": {"summary": "s"}}
    final = final_node(state)["final"]
    assert final["extraction"] == {"a": 1}
    assert "authorized Quality personnel" in final["disclaimer"]