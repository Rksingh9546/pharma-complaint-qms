"""Seed PostgreSQL with realistic sample complaints.

Usage (backend venv active, database running):
    python -m scripts.seed            # skips already-seeded (customer, batch) pairs
    python -m scripts.seed --force    # wipes and reseeds everything

Values for risk/AI fields are representative (matching what the live workflow
produces) so the seeded register is deterministic and needs no API key.
"""
import argparse
from datetime import date

from app.db.base import SessionLocal
from app.models import Complaint
from app.schemas.complaint import ComplaintCreate
from app.services import complaint_service

SAMPLES = [
    {
        "source": "Email", "customer_name": "ABC Healthcare",
        "customer_email": "qa@abchealthcare.com", "country": "India",
        "complaint_received_date": date(2025, 11, 10),
        "product_name": "Paracetamol 500 mg Tablets", "product_type": "FDF",
        "strength": "500 mg", "batch_number": "PCM-260501",
        "manufacturing_date": date(2025, 5, 1), "expiry_date": date(2027, 4, 30),
        "quantity_affected": 250, "unit": "packs",
        "complaint_type": "Physical Defect", "complaint_date": date(2025, 11, 8),
        "description": "Several Paracetamol 500 mg tablets found broken inside blister "
                       "packaging. Approximately 250 packs affected. No adverse patient "
                       "event reported; the customer requested a formal investigation.",
        "severity": "Major", "priority": "High",
        "investigation_required": True, "adverse_event": False,
        "risk_score": 76, "risk_level": "HIGH",
        "risk_factors": ["Product quality defect reported", "Multiple units affected (250 packs)",
                         "Identifiable batch — traceable to manufacturing"],
        "ai_summary": "ABC Healthcare reported approximately 250 packs of Paracetamol 500 mg "
                      "Tablets (batch PCM-260501) with broken tablets inside blister packaging. "
                      "No adverse patient event was reported; a formal investigation was requested.",
        "ai_recommendation": {
            "actions": ["Initiate QA investigation for batch PCM-2601",
                        "Review packaging line records and blister sealing parameters",
                        "Check for similar complaints on the same batch",
                        "Evaluate CAPA requirement based on investigation outcome"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "Insufficient blister sealing force or tablet "
                                              "brittleness during packaging operations",
                     "corrective_action": "Quarantine and test retain samples from batch "
                                          "PCM-260501; replace affected customer stock",
                     "preventive_action": "Review blister tooling calibration schedule and add "
                                          "in-process tablet breakage checks"},
        },
        "status": "Under Investigation",
    },
    {
        "source": "Email", "customer_name": "Medlife Pharmaceuticals Ltd.",
        "customer_email": "quality@medlifepharma.com", "country": "India",
        "complaint_received_date": date(2026, 1, 12),
        "product_name": "Amoxicillin Trihydrate API (Compacted)", "product_type": "API",
        "strength": "Bulk density 0.55 g/ml", "batch_number": "AMX-250814",
        "manufacturing_date": date(2025, 8, 14), "expiry_date": date(2027, 7, 31),
        "quantity_affected": 120, "unit": "kg",
        "complaint_type": "Contamination", "complaint_date": date(2026, 1, 12),
        "description": "Yellowish discoloration observed in 3 of 10 polyethylene bags of "
                       "Amoxicillin Trihydrate API during incoming inspection; specification "
                       "requires white to off-white powder. 120 kg of 1000 kg affected.",
        "severity": "Major", "priority": "Medium",
        "investigation_required": True, "adverse_event": False,
        "risk_score": 58, "risk_level": "MEDIUM",
        "risk_factors": ["API discoloration against specification",
                         "120 kg of a 1000 kg lot affected",
                         "No market exposure — material not yet used in FDF"],
        "ai_summary": "Medlife Pharmaceuticals reported yellowish discoloration in 120 kg of "
                      "Amoxicillin Trihydrate API batch AMX-250814 during incoming inspection, "
                      "against a white-to-off-white specification. No market exposure occurred.",
        "ai_recommendation": {
            "actions": ["Initiate QA investigation including retain sample analysis",
                        "Review batch manufacturing and drying records",
                        "Assess shipment storage conditions with the distributor"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "Possible moisture ingress or oxidation during "
                                              "bulk storage/shipment",
                     "corrective_action": "Analyze discolored retain samples; replace affected "
                                          "bags from stock",
                     "preventive_action": "Review packaging integrity controls and shipping "
                                          "condition monitoring for API drums"},
        },
        "status": "Open",
    },
    {
        "source": "Phone", "customer_name": "Northside Pharmacy Group",
        "customer_email": "complaints@northsidepharmacy.co.uk", "country": "United Kingdom",
        "complaint_received_date": date(2026, 2, 3),
        "product_name": "Ibuprofen 200 mg Soft Gel Capsules", "product_type": "FDF",
        "strength": "200 mg", "batch_number": "IBU-251022",
        "manufacturing_date": date(2025, 10, 22), "expiry_date": date(2028, 10, 31),
        "quantity_affected": 60, "unit": "packs",
        "complaint_type": "Labeling Error", "complaint_date": date(2026, 2, 3),
        "description": "Outer cartons state 200 mg while inner blister foil is printed 400 mg "
                       "for Ibuprofen Soft Gel Capsules. Approximately 60 packs identified; "
                       "stock quarantined. Potential double-dose intake exists for patients.",
        "severity": "Critical", "priority": "Urgent",
        "investigation_required": True, "adverse_event": False,
        "risk_score": 88, "risk_level": "CRITICAL",
        "risk_factors": ["Carton/blister strength mismatch — labeling mix-up",
                         "Potential double-dose intake identified",
                         "Product distributed to patients via retail",
                         "Regulatory (MHRA) notification may be required"],
        "ai_summary": "Northside Pharmacy Group reported a carton/blister strength mismatch on "
                      "Ibuprofen Soft Gel Capsules batch IBU-251022 (carton 200 mg, foil 400 mg). "
                      "Approximately 60 packs affected and quarantined; regulatory notification "
                      "may be required.",
        "ai_recommendation": {
            "actions": ["Initiate QA investigation at highest priority",
                        "Quarantine remaining stock of batch IBU-251022 across the supply chain",
                        "Notify senior management and the Qualified Person",
                        "Assess regulatory reporting obligations (MHRA) and recall evaluation"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "Mix-up of printed components between 200 mg and "
                                              "400 mg packaging lines during changeover",
                     "corrective_action": "Recall/replace affected stock; reconcile printed "
                                          "component issuance for the batch",
                     "preventive_action": "Implement line clearance verification and automated "
                                          "carton/foil barcode matching"},
        },
        "status": "Under Investigation",
    },
    {
        "source": "Letter", "customer_name": "Pharmanova Trading GmbH",
        "customer_email": "lk.weber@pharmanova.de", "country": "Germany",
        "complaint_received_date": date(2026, 1, 20),
        "product_name": "Cetirizine HCl Oral Solution 5 mg/5 ml", "product_type": "FDF",
        "strength": "5 mg/5 ml", "batch_number": "CTZ-250917",
        "manufacturing_date": date(2025, 9, 17), "expiry_date": date(2027, 9, 16),
        "quantity_affected": 48, "unit": "bottles",
        "complaint_type": "Packaging Defect", "complaint_date": date(2026, 1, 20),
        "description": "48 of 240 bottles of Cetirizine Oral Solution found leaking from the "
                       "cap area during shelf replenishment; sticky residue on exteriors and "
                       "cartons. No patient exposure reported. Stock isolated.",
        "severity": "Minor", "priority": "Medium",
        "investigation_required": True, "adverse_event": False,
        "risk_score": 45, "risk_level": "MEDIUM",
        "risk_factors": ["Leaking bottles from cap seal area",
                         "48 of 240 bottles in one shipment",
                         "No patient exposure reported"],
        "ai_summary": "Pharmanova Trading reported 48 of 240 bottles of Cetirizine Oral "
                      "Solution (batch CTZ-250917) leaking from the cap area. No patient "
                      "exposure occurred; stock was isolated pending replacement.",
        "ai_recommendation": {
            "actions": ["Log and triage for QA review",
                        "Investigate cap liner sealing and torque parameters",
                        "Replace affected distributor stock"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "Inadequate cap liner sealing or over/under-torque "
                                              "during capping",
                     "corrective_action": "Replace affected bottles; inspect retain samples for "
                                          "seal integrity",
                     "preventive_action": "Add capping torque verification to in-process checks"},
        },
        "status": "Closed",
    },
    {
        "source": "Email", "customer_name": "Farmabrasil Distribuidora",
        "customer_email": "c.oliveira@farmabrazil.com.br", "country": "Brazil",
        "complaint_received_date": date(2026, 1, 26),
        "product_name": "Metformin Hydrochloride API (Granulated)", "product_type": "API",
        "strength": "Assay 95-105%", "batch_number": "MTF-251108",
        "manufacturing_date": date(2025, 11, 8), "expiry_date": date(2027, 11, 7),
        "quantity_affected": 150, "unit": "kg",
        "complaint_type": "Stability Issue", "complaint_date": date(2026, 1, 26),
        "description": "Hard caking and lump formation observed in 6 of 20 fiber drums of "
                       "Metformin HCl API during warehouse inspection. 150 kg of 500 kg "
                       "affected; stored within labeled conditions. Production campaign on hold.",
        "severity": "Major", "priority": "Medium",
        "investigation_required": True, "adverse_event": False,
        "risk_score": 52, "risk_level": "MEDIUM",
        "risk_factors": ["Moisture-related caking in API drums",
                         "150 kg of 500 kg affected — partial batch impact",
                         "Customer production campaign dependent on material"],
        "ai_summary": "Farmabrasil Distribuidora reported caking in 6 of 20 drums (150 kg) of "
                      "Metformin HCl API batch MTF-251108 despite compliant storage. The "
                      "customer requested urgent guidance on batch disposition.",
        "ai_recommendation": {
            "actions": ["Initiate QA investigation with retain sample testing",
                        "Review granulation drying parameters and moisture data for the batch",
                        "Advise customer on batch disposition and hold status"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "Residual moisture above specification or "
                                              "inadequate drum liner sealing",
                     "corrective_action": "Test retain samples for water content; replace or "
                                          "reprocess affected quantity",
                     "preventive_action": "Tighten in-process moisture limits and verify drum "
                                          "liner integrity before dispatch"},
        },
        "status": "Open",
    },
    {
        "source": "Email", "customer_name": "Community Rx Pharmacy",
        "customer_email": "j.peterson@communityrxpharmacy.com",
        "complaint_received_date": date(2026, 2, 5),
        "product_name": "Atorvastatin 20 mg Tablets", "product_type": "FDF",
        "strength": "20 mg", "batch_number": "ATV-250902",
        "manufacturing_date": date(2025, 9, 2), "expiry_date": date(2027, 9, 30),
        "quantity_affected": 1, "unit": "packs",
        "complaint_type": "Adverse Event", "complaint_date": date(2026, 2, 5),
        "description": "A 62-year-old patient developed a mild non-blistering rash on the "
                       "forearms approximately three days after starting Atorvastatin 20 mg "
                       "Tablets from batch ATV-250902. Patient discontinued medication; "
                       "physician contact advised. First complaint for the batch.",
        "severity": "Critical", "priority": "Urgent",
        "investigation_required": True, "adverse_event": True,
        "risk_score": 87, "risk_level": "CRITICAL",
        "risk_factors": ["Suspected adverse event (mild rash) after product use",
                         "Patient discontinued medication",
                         "Pharmacovigilance reporting may be required",
                         "First complaint for batch ATV-250902"],
        "ai_summary": "Community Rx Pharmacy reported a suspected adverse event: a 62-year-old "
                      "patient developed a mild rash days after starting Atorvastatin 20 mg "
                      "Tablets (batch ATV-250902). The patient stopped the medication; "
                      "pharmacovigilance assessment is required.",
        "ai_recommendation": {
            "actions": ["Initiate QA investigation immediately (highest priority)",
                        "File in the pharmacovigilance system and assess regulatory reportability",
                        "Quarantine remaining stock of batch ATV-250902 pending review",
                        "Review batch manufacturing and stability records"],
            "capa": {"may_be_required": True,
                     "root_cause_hypothesis": "To be determined — potential patient-specific "
                                              "hypersensitivity vs. product quality cause",
                     "corrective_action": "Complete adverse event follow-up with the patient's "
                                          "physician; test retain samples from the batch",
                     "preventive_action": "Trend adverse events for this product and review "
                                          "coating/impurity profile if a product cause is indicated"},
        },
        "status": "Under Investigation",
    },
]


def main(force: bool = False) -> None:
    db = SessionLocal()
    try:
        if force:
            deleted = db.query(Complaint).delete()
            db.commit()
            print(f"Cleared {deleted} existing complaint(s).")

        existing = {(c.customer_name, c.batch_number)
                    for c in complaint_service.list_complaints(db)}

        created = 0
        for sample in SAMPLES:
            key = (sample["customer_name"], sample["batch_number"])
            if key in existing:
                print(f"  skipped (already seeded): {sample['customer_name']} / "
                      f"{sample['batch_number']}")
                continue
            complaint = complaint_service.create_complaint(db, ComplaintCreate(**sample))
            print(f"  created {complaint.complaint_number}: "
                  f"{complaint.product_name} ({complaint.risk_level})")
            created += 1

        print(f"\nDone — {created} new complaint(s), "
              f"{len(SAMPLES) - created} skipped.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed sample complaints.")
    parser.add_argument("--force", action="store_true",
                        help="delete all complaints first, then reseed")
    main(force=parser.parse_args().force)