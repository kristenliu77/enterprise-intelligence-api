import logging
import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from config import settings
from services.cache import cache_result


logger = logging.getLogger(__name__)

DEFAULT_CURRENCY = "CNY"
MAX_RETRIES = 3


def _extract_events(payload: Any) -> List[Dict[str, Any]]:
    """Extract funding event rows from common response shapes."""
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("events", "financings", "fundingEvents", "records", "items", "list"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = _extract_events(value)
            if nested:
                return nested

    for value in payload.values():
        nested = _extract_events(value)
        if nested:
            return nested

    return []


def _parse_event_date(value: Any) -> Optional[date]:
    """Parse funding event dates from strings or timestamps."""
    if value in (None, ""):
        return None

    if isinstance(value, (int, float)):
        timestamp = value / 1000 if value > 10_000_000_000 else value
        return datetime.fromtimestamp(timestamp).date()

    text = str(value).strip()[:10].replace(".", "-").replace("/", "-")
    for fmt in ("%Y-%m-%d", "%Y%m%d"):
        try:
            if fmt == "%Y-%m-%d":
                return date.fromisoformat(text)
            return date(int(text[0:4]), int(text[4:6]), int(text[6:8]))
        except (ValueError, IndexError):
            continue

    return None


def _normalize_currency(value: Any, amount_text: str = "") -> str:
    """Infer ISO currency code from explicit currency or amount text."""
    text = f"{value or ''} {amount_text}".upper()
    if any(token in text for token in ("USD", "美元", "$")):
        return "USD"
    if any(token in text for token in ("HKD", "港元", "港币")):
        return "HKD"
    if any(token in text for token in ("EUR", "欧元")):
        return "EUR"
    if any(token in text for token in ("GBP", "英镑")):
        return "GBP"
    if any(token in text for token in ("JPY", "日元")):
        return "JPY"
    return DEFAULT_CURRENCY


def _extract_number(text: str) -> Optional[float]:
    """Extract a representative numeric value from amount text."""
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-~至到]\s*(\d+(?:\.\d+)?)", text)
    if range_match:
        return (float(range_match.group(1)) + float(range_match.group(2))) / 2

    number_match = re.search(r"(\d+(?:\.\d+)?)", text)
    if number_match:
        return float(number_match.group(1))

    if "数十" in text:
        return 50.0
    if "数百" in text:
        return 500.0
    if "数千" in text:
        return 5000.0
    if "数亿" in text:
        return 3.0

    return None


def _amount_to_base_currency_units(raw_amount: Any, raw_unit: Any = None) -> Optional[float]:
    """Convert a raw amount with Chinese units into base currency units."""
    if raw_amount in (None, "", "未披露", " undisclosed"):
        return None

    amount_text = str(raw_amount).replace(",", "").strip()
    unit_text = str(raw_unit or "")
    combined = f"{amount_text}{unit_text}"
    amount = float(raw_amount) if isinstance(raw_amount, (int, float)) else _extract_number(amount_text)
    if amount is None:
        return None

    if "亿" in combined:
        return amount * 100_000_000
    if "千万" in combined:
        return amount * 10_000_000
    if "百万" in combined:
        return amount * 1_000_000
    if "万" in combined:
        return amount * 10_000

    return amount


async def _currency_to_cny_rate(currency: str, client: httpx.AsyncClient) -> float:
    """Fetch a currency-to-CNY exchange rate from the configured free API."""
    if currency == DEFAULT_CURRENCY:
        return 1.0

    url = settings.exchange_rate_api_url.format(currency=currency)
    try:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Failed to fetch exchange rate for %s: %s", currency, exc)
        return 0.0

    rates = payload.get("rates") if isinstance(payload, dict) else None
    if not isinstance(rates, dict):
        logger.warning("Exchange rate response for %s did not contain rates.", currency)
        return 0.0

    rate = rates.get(DEFAULT_CURRENCY)
    try:
        return float(rate)
    except (TypeError, ValueError):
        logger.warning("Exchange rate response for %s did not contain CNY rate.", currency)
        return 0.0


def _investors(event: Dict[str, Any]) -> List[str]:
    """Normalize investor names from string or list fields."""
    raw_investors = event.get("investors") or event.get("investorList") or event.get("institutions") or []
    if isinstance(raw_investors, str):
        return [item.strip() for item in re.split(r"[,，;；、]", raw_investors) if item.strip()]

    if isinstance(raw_investors, list):
        investors: List[str] = []
        for item in raw_investors:
            if isinstance(item, dict):
                name = item.get("name") or item.get("investorName") or item.get("institutionName")
                if name:
                    investors.append(str(name).strip())
            elif item:
                investors.append(str(item).strip())
        return investors

    return []


async def _normalize_event(event: Dict[str, Any], client: httpx.AsyncClient) -> Optional[Dict[str, Any]]:
    """Normalize a raw funding event into the public response schema."""
    event_date = _parse_event_date(
        event.get("date") or event.get("fundingDate") or event.get("financeDate") or event.get("publishedAt")
    )
    if not event_date:
        return None

    raw_amount = event.get("amount") or event.get("financeAmount") or event.get("money") or event.get("amountText")
    raw_unit = event.get("amountUnit") or event.get("unit")
    amount_units = _amount_to_base_currency_units(raw_amount, raw_unit)
    amount_text = str(raw_amount or "")
    currency = _normalize_currency(event.get("currency"), amount_text)

    if amount_units is None:
        amount_10k_cny = 0.0
    else:
        rate = await _currency_to_cny_rate(currency, client)
        amount_10k_cny = amount_units * rate / 10_000 if rate else 0.0

    return {
        "date": event_date.isoformat(),
        "round": str(event.get("round") or event.get("roundName") or event.get("financeRound") or ""),
        "amount": round(amount_10k_cny, 2),
        "currency": DEFAULT_CURRENCY,
        "investors": _investors(event),
    }


@cache_result(ttl_seconds=6 * 60 * 60)
async def get_funding_events(company_name: str, months: int = 6) -> List[Dict[str, Any]]:
    """Fetch recent Xiniu/Xiniu funding events for a company.

    Args:
        company_name: Company name used as the query keyword.
        months: Number of recent months to include. Defaults to 6.

    Returns:
        A list of normalized funding records. Each record contains ``date``,
        ``round``, ``amount`` in ten-thousand CNY, ``currency`` fixed to ``CNY``,
        and ``investors``. If credentials are missing, the company has no records,
        or the upstream API is unavailable, an empty list is returned.
    """
    query = company_name.strip()
    if not query:
        logger.warning("Xiniu funding query skipped because company_name is empty.")
        return []

    if months <= 0:
        logger.warning("Xiniu funding query skipped because months must be positive.")
        return []

    if not settings.xiniu_api_token:
        logger.warning("Xiniu funding query skipped because XENNIU_API_TOKEN is missing.")
        return []

    path = settings.xiniu_funding_path
    if not path.startswith("/"):
        path = f"/{path}"
    url = f"{settings.xiniu_base_url.rstrip('/')}{path}"

    cutoff = date.today() - timedelta(days=months * 30)
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {settings.xiniu_api_token}",
        "X-API-Token": settings.xiniu_api_token,
        "User-Agent": "enterprise-intelligence-api/0.1",
    }
    params = {"company_name": query, "companyName": query, "months": months}

    async with httpx.AsyncClient(timeout=10.0) as client:
        payload: Any = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                payload = response.json()
                break
            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.HTTPError, ValueError) as exc:
                logger.warning("Xiniu funding request failed on attempt %s/%s: %s", attempt, MAX_RETRIES, exc)
                if attempt == MAX_RETRIES:
                    return []

        events = _extract_events(payload)
        results: List[Dict[str, Any]] = []
        for event in events:
            normalized = await _normalize_event(event, client)
            if not normalized:
                continue
            event_date = _parse_event_date(normalized["date"])
            if event_date and event_date >= cutoff:
                results.append(normalized)

        return sorted(results, key=lambda item: item["date"], reverse=True)
