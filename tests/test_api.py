from app.ai.llm import LLMError

def _create(client, **overrides):
    payload = {"customer_name": "ABC Healthcare",
               "product_name": "Paracetamol 500 mg Tablets"}
    payload.update(overrides)
    return client.post("/api/complaints", json=payload)


# ── health & CRUD ─────────────────────────────────────────────────────

def test_health_ok(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_create_and_fetch_complaint(client):
    response = _create(client, batch_number="PCM-260501", severity="Major")
    assert response.status_code == 201
    body = response.json()
    assert body["complaint_number"].startswith("CC-")
    assert body["batch_number"] == "PCM-260501"

    fetched = client.get(f"/api/complaints/{body['id']}").json()
    assert fetched["customer_name"] == "ABC Healthcare"


def test_create_requires_customer_and_product(client):
    assert client.post("/api/complaints", json={"customer_name": "Only customer"}).status_code == 422


def test_get_missing_complaint_404(client):
    assert client.get("/api/complaints/9999").status_code == 404


def test_list_with_search_and_filters(client):
    _create(client, product_name="Paracetamol 500 mg Tablets", severity="Major")
    _create(client, customer_name="Other Co", product_name="Amoxicillin API", severity="Minor")

    search = client.get("/api/complaints", params={"search": "paracetamol"}).json()
    assert len(search) == 1
    filtered = client.get("/api/complaints", params={"severity": "Minor"}).json()
    assert len(filtered) == 1 and filtered[0]["product_name"] == "Amoxicillin API"
    assert all(c["severity"] == "Minor" for c in filtered)


# ── document extraction ───────────────────────────────────────────────

def test_extract_txt_document(client):
    files = {"file": ("note.txt", b"Broken tablets in blisters.", "text/plain")}
    response = client.post("/api/complaints/extract", files=files)
    assert response.status_code == 200
    assert "Broken tablets" in response.json()["text"]


def test_extract_rejects_unsupported_type(client):
    files = {"file": ("v.exe", b"MZ", "application/octet-stream")}
    assert client.post("/api/complaints/extract", files=files).status_code == 400


# ── analyze (workflow mocked — wiring + error mapping under test) ─────

def test_analyze_returns_workflow_result(client, monkeypatch):
    from app.api.routes import complaints as routes
    fake = {"extraction": {"customer_name": "ABC"}, "completeness": {"percentage": 50},
            "risk": {"risk_level": "HIGH", "risk_score": 75},
            "recommendations": {"summary": "s"}, "disclaimer": "AI-assisted."}
    monkeypatch.setattr(routes, "run_complaint_workflow", lambda text: fake)
    response = client.post("/api/complaints/analyze", json={"text": "A" * 50})
    assert response.status_code == 200
    assert response.json()["risk"]["risk_level"] == "HIGH"


def test_analyze_maps_llm_error_to_502(client, monkeypatch):
    from app.api.routes import complaints as routes

    def boom(text):
        raise LLMError("Groq is down")

    monkeypatch.setattr(routes, "run_complaint_workflow", boom)
    response = client.post("/api/complaints/analyze", json={"text": "A" * 50})
    assert response.status_code == 502
    assert "Groq is down" in response.json()["detail"]


def test_analyze_rejects_empty_text(client):
    assert client.post("/api/complaints/analyze", json={"text": "   "}).status_code == 422


# ── duplicate detection over HTTP ──────────────────────────────────────

def test_check_duplicate_endpoint(client):
    _create(client, customer_name="ABC Healthcare",
            product_name="Paracetamol 500 mg Tablets", batch_number="PCM-260501")
    response = client.post("/api/complaints/check-duplicate", json={
        "customer_name": "ABC Healthcare",
        "product_name": "Paracetamol 500 mg tablets",
        "batch_number": "PCM-260501"})
    assert response.status_code == 200
    body = response.json()
    assert body["max_similarity"] == 75  # batch 40 + product 20 + customer 15
    assert body["matches"][0]["batch_number"] == "PCM-260501"