# Pharma Complaint QMS
## AI-Powered Customer Complaint Management System

A full-stack Quality Management System (QMS) for managing pharmaceutical customer complaints related to **API (Active Pharmaceutical Ingredient)** and **FDF (Finished Dosage Form)** products.

The AI Complaint Intake Assistant accepts complaint text or a PDF, DOCX, TXT, or EML file. A LangGraph workflow uses Groq to extract complaint details, check completeness, assess risk, and recommend next actions. Users can review and edit the suggestions before saving a complaint.


## Features

- AI-assisted complaint intake:** Extracts structured information from complaint text or supported documents and fills the complaint form.
- Risk assessment: Provides a risk level (LOW, MEDIUM, HIGH, or CRITICAL), score, confidence, risk factors, explanation, and suggested actions.
- CAPA recommendations:Suggests a possible root cause, corrective and preventive actions, and whether CAPA may be required.
- Completeness checker: Shows a completeness percentage and identifies missing required fields.
- Duplicate detection: Compares a new complaint with saved records using batch number, product, customer, and description similarity.
- Complaint register: Search and filter complaints, open detailed records, and run risk or completeness checks.
- Document validation:Supports PDF, DOCX, TXT, and EML files up to 10 MB. Empty or image-only files are rejected; OCR is not included.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Redux Toolkit, React Router 6, Tailwind CSS 3, Axios |
| Backend | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2 |
| AI workflow | LangGraph `StateGraph`, Groq API (`gemma2-9b-it`) |
| Database | PostgreSQL 14+; in-memory SQLite for tests |
| Document parsing | `pypdf`, `python-docx`, Python standard-library `email` parser |

## Application Workflow

1. Enter complaint text or upload a supported document.
2. Extract the text and run AI analysis.
3. Review extracted fields, completeness, risk assessment, and recommendations.
4. Edit any information that needs correction.
5. Save the complaint and open its details page.

### LangGraph workflow

```text
START
  → extract_complaint
  → validate_completeness
  → assess_risk
  → generate_recommendations
  → finalize_response
  → END
```

Extraction, risk assessment, and recommendations use the LLM. Completeness validation and final response assembly are deterministic. LLM output is parsed and validated before it is returned to the frontend.

## Project Structure

```text
aivoa-complaint-management/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── ComplaintIntakePage
│   │   │   ├── ComplaintListPage
│   │   │   └── ComplaintDetailsPage
│   │   ├── services/api.js
│   │   ├── store/slices/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── ai/
│   │   │   ├── llm.py
│   │   │   └── graph/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── db/
│   │   ├── config.py
│   │   └── main.py
│   ├── scripts/seed.py
│   ├── requirements.txt
│   └── .env.example
├── sample_data/
├── tests/
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check service status |
| POST | `/api/complaints/extract` | Extract text from an uploaded document |
| POST | `/api/complaints/analyze` | Run the AI complaint workflow |
| POST | `/api/complaints` | Save a complaint |
| GET | `/api/complaints` | List complaints; supports search and filters |
| GET | `/api/complaints/{id}` | Get complaint details |
| POST | `/api/complaints/{id}/risk` | Recalculate and save risk assessment |
| POST | `/api/complaints/{id}/completeness` | Check completeness of a saved complaint |
| POST | `/api/complaints/check-duplicate` | Compare a complaint with saved records |

Interactive API documentation: `http://localhost:8000/docs` (when the backend is running).

## Requirements

- Python 3.10 or later
- Node.js 18 or later
- PostgreSQL 14 or later
- Groq API key

## Setup and Run

Run the backend and frontend in separate terminal windows.

### 1. Set up the database

If PostgreSQL is installed locally:

```bash
createdb complaints_db
```

Alternatively, with Docker:

```bash
docker run --name complaints-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=complaints_db \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Configure and run the backend

From the project root:

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

On Windows, activate with:

```bat
venv\\Scripts\\activate
```

Install dependencies and create the environment file:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set your Groq API key and database connection string. Then start the API:

```bash
uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`

### 3. Run the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

The Vite development proxy forwards `/api` requests to `http://localhost:8000`.

### 4. Optional: Load sample data

From the project root:

```bash
cd backend
source venv/bin/activate
python -m scripts.seed
```

Review the seed script before using any option that may delete or replace existing data.

## Environment Variables

Configure these in `backend/.env`:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq API key; backend only |
| `GROQ_MODEL` | Groq model name; defaults to `gemma2-9b-it` |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Allowed frontend origin; defaults to `http://localhost:5173` |

**Never commit `backend/.env` or expose `GROQ_API_KEY` in frontend code.**

## Testing

From the project root:

```bash
pytest tests/ -v
```

The test suite uses mocked LLM responses and in-memory SQLite, so tests do not require a live Groq API key or PostgreSQL database.

## Security and Quality Notes

- Keep the Groq API key on the backend.
- Uploaded files are restricted by type and size.
- API request data is validated with Pydantic.
- LLM responses are parsed and validated before use.
- AI assessments and recommendations support the Quality team; they do not replace authorized human review.

## Deployment Status

Deployment configuration is **not included** in the repository. This README documents local development; Docker deployment, production reverse-proxy configuration, and CI/CD are not provided.

## Future Improvements

- Add database migrations with Alembic.
- Add authentication and role-based Quality review and approval workflows.
- Store complaint attachments with the relevant investigation.
- Add live per-stage analysis progress.
- Improve duplicate detection and add complaint trend analytics.
- Build a dedicated CAPA module with effectiveness checks.


