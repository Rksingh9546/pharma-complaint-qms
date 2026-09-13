"""Document text extraction service.

Converts uploaded complaint documents (PDF / DOCX / TXT / EML) into plain
text for the AI workflow. Production-grade OCR is intentionally out of
scope: image-only documents produce a clear error, not garbage text.
"""
from __future__ import annotations

import email
import html as html_lib
import re
from email import policy
from email.message import Message
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader
from docx import Document as DocxDocument

from app.config import (
    ALLOWED_UPLOAD_EXTENSIONS,
    MAX_TEXT_CHARS_FOR_LLM,
    MAX_UPLOAD_SIZE_BYTES,
)

MB = 1024 * 1024


# ── Public API ────────────────────────────────────────────────────────

def validate_upload(filename: str, size: int) -> str:
    """Validate extension and size. Returns the normalized extension.
    Raises ValueError with a user-friendly message."""
    if not filename or "." not in filename:
        raise ValueError("Invalid file: the file has no name or extension.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))
        raise ValueError(f"Unsupported file type '{ext}'. Supported formats: {allowed}.")

    if size == 0:
        raise ValueError("The uploaded file is empty.")

    if size > MAX_UPLOAD_SIZE_BYTES:
        raise ValueError(
            f"File too large ({size / MB:.1f} MB). "
            f"Maximum upload size is {MAX_UPLOAD_SIZE_BYTES // MB} MB."
        )
    return ext


def extract_text(filename: str, content: bytes) -> str:
    """Extract and normalize text from an uploaded document.
    Raises ValueError if the file is invalid or contains no text."""
    ext = validate_upload(filename, len(content))

    extractors = {
        ".pdf": _extract_pdf,
        ".docx": _extract_docx,
        ".txt": _extract_txt,
        ".eml": _extract_eml,
    }
    text = normalize_text(extractors[ext](content))

    if not text.strip():
        raise ValueError(
            "No text could be extracted from this document. It may be a "
            "scanned/image-only file (OCR is not supported) or an empty document."
        )
    return text


def normalize_text(text: str, max_chars: int = MAX_TEXT_CHARS_FOR_LLM) -> str:
    """Collapse excess whitespace and cap length before LLM calls."""
    text = re.sub(r"[ \t]+\n", "\n", text)      # trailing spaces before newlines
    text = re.sub(r"[ \t]{2,}", " ", text)     # runs of spaces/tabs
    text = re.sub(r"\n{3,}", "\n\n", text)     # 3+ blank lines -> one
    return text.strip()[:max_chars]


# ── Format extractors ─────────────────────────────────────────────────

def _extract_pdf(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Could not read the PDF file: {exc}") from exc


def _extract_docx(content: bytes) -> str:
    try:
        document = DocxDocument(BytesIO(content))
        parts = [p.text for p in document.paragraphs if p.text.strip()]
        # Complaint forms are often laid out as tables — include them.
        for table in document.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    parts.append(" | ".join(cells))
        return "\n".join(parts)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Could not read the DOCX file: {exc}") from exc


def _extract_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8-sig")   # utf-8-sig also strips a Windows BOM
    except UnicodeDecodeError:
        return content.decode("latin-1", errors="replace")


def _extract_eml(content: bytes) -> str:
    msg = email.message_from_bytes(content, policy=policy.default)

    subject = str(msg.get("Subject") or "")
    sender = str(msg.get("From") or "")
    sent_date = str(msg.get("Date") or "")

    plain, html_body = "", ""
    for part in msg.walk():
        if part.is_multipart():
            continue
        ctype = part.get_content_type()
        if ctype == "text/plain" and not plain:
            plain = _part_text(part)
        elif ctype == "text/html" and not html_body:
            html_body = _part_text(part)

    body = plain if plain else _strip_html(html_body)

    header_lines = []
    if subject:
        header_lines.append(f"Subject: {subject}")
    if sender:
        header_lines.append(f"From: {sender}")
    if sent_date:
        header_lines.append(f"Date: {sent_date}")
    header = "\n".join(header_lines)
    return f"{header}\n\n{body}" if header else body


def _part_text(part: Message) -> str:
    """Safely decode a MIME part to text."""
    try:
        return part.get_content()
    except Exception:
        payload = part.get_payload(decode=True)
        if payload is None:
            return ""
        return payload.decode("utf-8", errors="replace")


def _strip_html(html_text: str) -> str:
    """Minimal HTML -> text conversion for HTML-only emails."""
    text = re.sub(r"<br\s*/?>", "\n", html_text, flags=re.IGNORECASE)
    text = re.sub(r"</\s*(p|div|tr)\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    return html_lib.unescape(text)