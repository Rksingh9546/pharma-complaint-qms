"""FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import complaints, health
from app.config import settings
from app.db.init_db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure tables exist on startup. A DB failure is logged, not fatal —
    so /api/health can still report the problem."""
    try:
        init_db()
        logger.info("Database tables ensured.")
    except Exception as exc:
        logger.error("Database initialization failed: %s", exc)
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Customer Complaint Management System for "
                "pharmaceutical API / FDF products.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],   # locked to the Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(complaints.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all so every failure (e.g. DB down) returns JSON the frontend's
    axios layer can parse, instead of a plain-text 500."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})