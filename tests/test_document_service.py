from app.services import document_service

MB = 1024 * 1024


def test_txt_extraction():
    assert document_service.extract_text("note.txt", "Broken tablets".encode()) \
        == "Broken tablets"


def test_eml_extraction_includes_headers():
    eml = (b'From: QA <qa@example.com>\r\n'
           b'Subject: Complaint batch PCM-1\r\n'
           b'Date: Mon, 5 Jan 2026 10:00:00 +0000\r\n\r\n'
           b'Tablets broken.\r\n')
    text = document_service.extract_text("c.eml", eml)
    assert "qa@example.com" in text
    assert "Complaint batch PCM-1" in text
    assert "Tablets broken." in text


def test_invalid_extension_rejected():
    try:
        document_service.extract_text("virus.exe", b"MZ")
        assert False, "expected ValueError"
    except ValueError as e:
        assert "Unsupported file type" in str(e)


def test_oversized_file_rejected():
    try:
        document_service.extract_text("big.txt", b"x" * (10 * MB + 1))
        assert False, "expected ValueError"
    except ValueError as e:
        assert "too large" in str(e)


def test_empty_file_rejected():
    try:
        document_service.extract_text("empty.txt", b"")
        assert False, "expected ValueError"
    except ValueError as e:
        assert "empty" in str(e)


def test_normalize_text_truncates_to_llm_limit():
    assert len(document_service.normalize_text("a" * 60_000)) == 50_000


def test_normalize_text_collapses_whitespace():
    assert document_service.normalize_text("a  b\n\n\n\nc   ") == "a b\n\nc"