def risk_node(state: dict) -> dict:
    complaint = state.get("complaint") or state.get("extraction") or {}

    description = str(
        complaint.get("description") or state.get("raw_text") or ""
    ).lower()

    score = 0
    factors = []

    # Demo scoring rule: add 20 points for a product/packaging defect.
    if any(word in description for word in [
        "broken", "damaged", "cracked", "defect", "packaging", "blister"
    ]):
        score += 20
        factors.append("Product or packaging defect reported")

    adverse_event = complaint.get(
        "adverse_event_suspected",
        complaint.get("adverse_event", False),
    )

    if adverse_event:
        score += 50
        factors.append("Possible adverse event reported")

    if score >= 70:
        risk_level = "High"
        priority = "High"
    elif score >= 30:
        risk_level = "Medium"
        priority = "Medium"
    else:
        risk_level = "Low"
        priority = "Low"

    result = {
        **state,
        "risk_assessment": {
            "risk_score": score,
            "risk_level": risk_level,
            "priority": priority,
            "factors": factors,
        },
    }

    print("RISK NODE RESULT:", result["risk_assessment"])
    return result