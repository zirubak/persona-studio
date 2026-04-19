"""Extract plain text from documents (PDF, DOCX, HTML, MD, TXT)."""

from __future__ import annotations

from pathlib import Path

DOCUMENT_SUFFIXES: frozenset[str] = frozenset(
    {".pdf", ".docx", ".html", ".htm", ".md", ".markdown", ".txt"}
)


def is_document(path: Path) -> bool:
    return path.suffix.lower() in DOCUMENT_SUFFIXES


def extract_text(path: Path) -> str:
    """Dispatch by extension and return extracted plain text.

    Raises RuntimeError with a user-readable message if the file cannot be parsed.
    """
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(path)
    if suffix == ".docx":
        return _extract_docx(path)
    if suffix in {".html", ".htm"}:
        return _extract_html(path)
    if suffix in {".md", ".markdown", ".txt"}:
        # Strict decode: a bad encoding should surface as a per-file error in
        # the manifest rather than silently poisoning the corpus with \ufffd.
        return path.read_text(encoding="utf-8")
    raise RuntimeError(f"Unsupported document extension: {suffix} ({path})")


def _extract_pdf(path: Path) -> str:
    from pypdf import PdfReader  # local import keeps CLI fast

    reader = PdfReader(str(path))
    pages: list[str] = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception as exc:  # pypdf raises miscellaneous errors
            pages.append(f"[extraction error: {exc}]")
    return "\n\n".join(p.strip() for p in pages if p.strip())


def _extract_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_html(path: Path) -> str:
    import trafilatura

    raw = path.read_text(encoding="utf-8")
    extracted = trafilatura.extract(raw, include_comments=False, include_tables=True)
    if extracted:
        return extracted
    # fallback: strip tags with BeautifulSoup
    from bs4 import BeautifulSoup

    return BeautifulSoup(raw, "html.parser").get_text(separator="\n").strip()
