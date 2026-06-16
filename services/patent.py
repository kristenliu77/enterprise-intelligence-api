import hashlib
import hmac
import json
import logging
import time
from datetime import date, timedelta
from typing import Any, Dict, Iterable, List, Optional, Set
from urllib.parse import urlparse

import httpx

from config import settings
from services.cache import cache_result


logger = logging.getLogger(__name__)

DEFAULT_PATENT_RESULT: Dict[str, Any] = {
    "patent_count_30d": 0,
    "ipc_codes": [],
    "inventor_growth_rate": 0.0,
}


def _default_result() -> Dict[str, Any]:
    """Return the empty patent metrics response."""
    return dict(DEFAULT_PATENT_RESULT)


def _json_body(payload: Dict[str, Any]) -> str:
    """Serialize request payload deterministically for signing."""
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _build_patsnap_signature(method: str, path: str, body: str, timestamp: str) -> str:
    """Build a Patsnap request signature from configured API credentials.

    Patsnap's public product pages confirm REST API access, but the exact
    partner signing recipe is usually provided in account-specific developer
    documentation. This implementation keeps the signature generation isolated:
    it signs a canonical string with ``PATSNAP_SECRET`` using HMAC-SHA256.
    If the official tenant document specifies a different canonical string, only
    this helper should need to change.
    """
    body_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
    canonical = "\n".join([method.upper(), path, body_hash, timestamp, settings.patsnap_api_key])
    return hmac.new(settings.patsnap_secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()


def _headers(path: str, body: str) -> Dict[str, str]:
    """Build signed Patsnap request headers."""
    timestamp = str(int(time.time()))
    signature = _build_patsnap_signature("POST", path, body, timestamp)
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "enterprise-intelligence-api/0.1",
        "X-API-Key": settings.patsnap_api_key,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
    }


def _request_payload(company_name: str) -> Dict[str, Any]:
    """Build the Patsnap patent search request payload."""
    today = date.today()
    recent_start = today - timedelta(days=30)
    previous_start = today - timedelta(days=60)
    return {
        "query": {
            "assignee": company_name,
            "application_date_from": previous_start.isoformat(),
            "application_date_to": today.isoformat(),
        },
        "include": ["application_date", "ipc", "inventors"],
        "page": 1,
        "page_size": 100,
        "sort": [{"field": "application_date", "order": "desc"}],
        "analytics": {
            "recent_window_start": recent_start.isoformat(),
            "previous_window_start": previous_start.isoformat(),
        },
    }


def _walk_dicts(value: Any) -> Iterable[Dict[str, Any]]:
    """Yield dictionaries recursively from nested API payloads."""
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk_dicts(child)
    elif isinstance(value, list):
        for item in value:
            yield from _walk_dicts(item)


def _find_patent_items(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Find patent item rows in common Patsnap response shapes."""
    for key in ("patents", "patentList", "results", "items", "list", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = _find_patent_items(value)
            if nested:
                return nested

    for item in _walk_dicts(payload):
        for key in ("patents", "patentList", "results", "items", "list"):
            value = item.get(key)
            if isinstance(value, list):
                return [entry for entry in value if isinstance(entry, dict)]
    return []


def _parse_date(value: Any) -> Optional[date]:
    """Parse patent date values from supported string formats."""
    if value in (None, ""):
        return None
    text = str(value).strip()[:10].replace(".", "-").replace("/", "-")
    for fmt in ("%Y-%m-%d", "%Y%m%d"):
        try:
            return date.fromisoformat(text) if fmt == "%Y-%m-%d" else date(
                int(text[0:4]), int(text[4:6]), int(text[6:8])
            )
        except (ValueError, IndexError):
            continue
    return None


def _patent_application_date(patent: Dict[str, Any]) -> Optional[date]:
    """Extract a patent application date from known field names."""
    for key in ("application_date", "applicationDate", "apd", "applyDate", "filingDate"):
        parsed = _parse_date(patent.get(key))
        if parsed:
            return parsed
    return None


def _extract_ipc_codes(patents: List[Dict[str, Any]]) -> List[str]:
    """Extract sorted unique IPC codes from patent rows."""
    ipc_codes: Set[str] = set()
    for patent in patents:
        raw_ipc = patent.get("ipc") or patent.get("ipcCodes") or patent.get("ipc_classifications") or []
        if isinstance(raw_ipc, str):
            candidates = [part.strip() for part in raw_ipc.replace(";", ",").split(",")]
        elif isinstance(raw_ipc, list):
            candidates = []
            for item in raw_ipc:
                if isinstance(item, dict):
                    candidates.append(str(item.get("code") or item.get("ipc") or "").strip())
                else:
                    candidates.append(str(item).strip())
        else:
            candidates = []

        for code in candidates:
            if code:
                ipc_codes.add(code)
    return sorted(ipc_codes)


def _extract_inventors(patent: Dict[str, Any]) -> Set[str]:
    """Extract inventor names from a patent row."""
    raw_inventors = patent.get("inventors") or patent.get("inventor") or patent.get("inventorList") or []
    if isinstance(raw_inventors, str):
        return {name.strip() for name in raw_inventors.replace(";", ",").split(",") if name.strip()}
    if isinstance(raw_inventors, list):
        inventors: Set[str] = set()
        for item in raw_inventors:
            if isinstance(item, dict):
                name = item.get("name") or item.get("inventorName")
                if name:
                    inventors.add(str(name).strip())
            elif item:
                inventors.add(str(item).strip())
        return inventors
    return set()


def _summarize_patents(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Summarize patent count, IPC codes, and inventor growth."""
    patents = _find_patent_items(payload)
    if not patents:
        return _default_result()

    today = date.today()
    recent_start = today - timedelta(days=30)
    previous_start = today - timedelta(days=60)

    recent_patents: List[Dict[str, Any]] = []
    recent_inventors: Set[str] = set()
    previous_inventors: Set[str] = set()

    for patent in patents:
        application_date = _patent_application_date(patent)
        if not application_date:
            continue
        if application_date >= recent_start:
            recent_patents.append(patent)
            recent_inventors.update(_extract_inventors(patent))
        elif previous_start <= application_date < recent_start:
            previous_inventors.update(_extract_inventors(patent))

    if previous_inventors:
        growth_rate = (len(recent_inventors) - len(previous_inventors)) / len(previous_inventors)
    elif recent_inventors:
        growth_rate = 1.0
    else:
        growth_rate = 0.0

    return {
        "patent_count_30d": len(recent_patents),
        "ipc_codes": _extract_ipc_codes(recent_patents),
        "inventor_growth_rate": round(growth_rate, 4),
    }


@cache_result(ttl_seconds=24 * 60 * 60)
async def get_patent_info(company_name: str) -> Dict[str, Any]:
    """Query Patsnap patent signals for a company and return normalized metrics.

    The function uses Patsnap credentials from ``config.settings``:
    ``PATSNAP_API_KEY`` and ``PATSNAP_SECRET``. It sends a signed asynchronous
    POST request to the configured Patsnap patent search endpoint and extracts
    patent applications from the last 30 days, IPC classification codes, and the
    inventor growth rate compared with the previous 30-day window.

    Args:
        company_name: Company assignee name used in the patent search query.

    Returns:
        ``{"patent_count_30d": int, "ipc_codes": list[str],
        "inventor_growth_rate": float}``. If credentials are missing, the API is
        unavailable, or the response is not parseable, a default empty result is
        returned and the failure is logged.
    """
    query = company_name.strip()
    if not query:
        logger.warning("Patsnap patent query skipped because company_name is empty.")
        return _default_result()

    if not settings.patsnap_api_key or not settings.patsnap_secret:
        logger.warning("Patsnap patent query skipped because PATSNAP_API_KEY or PATSNAP_SECRET is missing.")
        return _default_result()

    path = settings.patsnap_patent_search_path
    if not path.startswith("/"):
        path = f"/{path}"

    base_url = settings.patsnap_base_url.rstrip("/")
    parsed_base = urlparse(base_url)
    path_for_signature = path
    if parsed_base.path:
        path_for_signature = f"{parsed_base.path.rstrip('/')}{path}"

    url = f"{base_url}{path}"
    body = _json_body(_request_payload(query))

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, content=body, headers=_headers(path_for_signature, body))
            response.raise_for_status()
            payload = response.json()
    except httpx.TimeoutException as exc:
        logger.warning("Patsnap patent request timed out for %s: %s", query, exc)
        return _default_result()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Patsnap patent request returned HTTP %s for %s.",
            exc.response.status_code,
            query,
        )
        return _default_result()
    except httpx.HTTPError as exc:
        logger.warning("Patsnap patent request failed for %s: %s", query, exc)
        return _default_result()
    except ValueError as exc:
        logger.warning("Patsnap patent response was not valid JSON for %s: %s", query, exc)
        return _default_result()

    if not isinstance(payload, dict):
        logger.warning("Patsnap patent response had unexpected payload type for %s.", query)
        return _default_result()

    status = payload.get("status") or payload.get("code")
    if status not in (None, 0, 200, "0", "200", "success", "SUCCESS"):
        logger.warning("Patsnap patent API returned an error for %s: %s", query, payload)
        return _default_result()

    return _summarize_patents(payload)
