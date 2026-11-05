"""Backward-compatible entry point; use ``uvicorn app.main:app``."""

from app.main import app

__all__ = ["app"]
