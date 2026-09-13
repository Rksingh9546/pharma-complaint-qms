"""Database initialization.

Assignment-grade: create tables from the models directly.
Production-grade would use Alembic migrations (see README 'Future improvements').
"""
from app.db.base import Base, engine


def init_db() -> None:
    import app.models  # noqa: F401 — imports register models on Base.metadata
    Base.metadata.create_all(bind=engine)