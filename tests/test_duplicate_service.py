from app.models import Complaint
from app.services import duplicate_service


def _add(db, **overrides):
    data = {"customer_name": "Default Co", "product_name": "Default Product"}
    data.update(overrides)
    db.add(Complaint(**data))
    db.commit()


def test_empty_draft_returns_nothing(db_session):
    result = duplicate_service.check_duplicates(db_session, {"customer_name": "   "})
    assert result == {"max_similarity": 0, "matches": []}


def test_exact_match_scores_high(db_session):
    _add(db_session, customer_name="ABC Healthcare",
         product_name="Paracetamol 500 mg Tablets", batch_number="PCM-260501",
         description="Broken tablets in blister packaging.")
    result = duplicate_service.check_duplicates(db_session, {
        "customer_name": "ABC Healthcare",
        "product_name": "Paracetamol 500 mg tablets",   # case differs — still fuzzy-matched
        "batch_number": "pcm-260501",                    # case-insensitive exact match
        "description": "Broken tablets in blister packaging.",
    })
    assert result["max_similarity"] >= 85
    assert result["matches"][0]["batch_number"] == "PCM-260501"


def test_unrelated_complaint_below_threshold(db_session):
    _add(db_session, customer_name="Other Co", product_name="Aspirin 100 mg",
         batch_number="ASP-1", description="Patient reported headache.")
    result = duplicate_service.check_duplicates(db_session, {
        "customer_name": "ABC Healthcare", "product_name": "Paracetamol 500 mg",
        "batch_number": "PCM-260501", "description": "Broken tablets in blisters."})
    assert result["matches"] == []