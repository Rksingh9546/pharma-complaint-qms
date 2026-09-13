"""Pytest path setup — allows running `pytest tests/` from the project root."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))
"""Shared fixtures: an in-memory SQLite database behind the FastAPI app.

SQLite works because the model applies JSONB only as a PostgreSQL variant.
No Groq key and no PostgreSQL are needed to run the suite.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — registers models on Base.metadata
from app.db.base import Base, get_db
from app.main import app


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one shared connection -> one shared in-memory DB
    )
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # No context manager => lifespan (real DB init) is not triggered.
    yield TestClient(app)
    app.dependency_overrides.clear()