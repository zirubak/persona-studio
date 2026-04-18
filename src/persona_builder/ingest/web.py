"""Fetch and extract article text from URLs listed in ``raw/urls.txt``.

Failures are recorded but do not abort the run. Successful extractions are
written as plain markdown files under ``raw/articles/`` so that subsequent
pipeline stages can treat them as regular documents.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FetchResult:
    url: str
    output_path: Path | None
    ok: bool
    error: str | None = None


def fetch_urls(urls_file: Path, articles_dir: Path) -> list[FetchResult]:
    if not urls_file.exists():
        return []
    urls = [
        line.strip()
        for line in urls_file.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    if not urls:
        return []
    articles_dir.mkdir(parents=True, exist_ok=True)

    import trafilatura

    results: list[FetchResult] = []
    for url in urls:
        slug = _slug_for(url)
        out = articles_dir / f"{slug}.md"
        if out.exists() and out.stat().st_size > 0:
            results.append(FetchResult(url=url, output_path=out, ok=True))
            continue
        try:
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                results.append(FetchResult(url=url, output_path=None, ok=False, error="download_failed"))
                continue
            text = trafilatura.extract(downloaded, include_comments=False, include_tables=True)
            if not text:
                results.append(FetchResult(url=url, output_path=None, ok=False, error="extract_empty"))
                continue
            out.write_text(f"# Source: {url}\n\n{text}\n", encoding="utf-8")
            results.append(FetchResult(url=url, output_path=out, ok=True))
        except Exception as exc:
            results.append(FetchResult(url=url, output_path=None, ok=False, error=str(exc)))
    return results


def _slug_for(url: str) -> str:
    trimmed = re.sub(r"^https?://", "", url)
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", trimmed).strip("-").lower()
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
    return f"{cleaned[:64]}-{digest}" if cleaned else f"url-{digest}"
