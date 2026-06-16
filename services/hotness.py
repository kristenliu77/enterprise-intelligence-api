import asyncio
import logging
from typing import Any, Awaitable, Dict, List, Optional

from config import INDUSTRY_BENCHMARKS, settings
from services.funding import get_funding_events
from services.patent import get_patent_info
from services.tianyancha import get_company_basic
from services.zhaopin import get_hiring_count


logger = logging.getLogger(__name__)

BASELINE_FALLBACK_RATIO = 0.5


async def _safe_call(name: str, call: Awaitable[Any], default: Any) -> Any:
    """Run one upstream call and return a default on failure."""
    try:
        return await call
    except Exception as exc:
        logger.warning("%s data source failed during hotness calculation: %s", name, exc)
        return default


def _clip_score(value: float) -> float:
    """Clamp a score to the inclusive 0-100 range."""
    return round(max(0.0, min(100.0, value)), 2)


def _normalize(value: Optional[float], benchmark: float) -> float:
    """Normalize a metric value against its industry benchmark."""
    if benchmark <= 0:
        return 50.0
    if value is None:
        value = benchmark * BASELINE_FALLBACK_RATIO
    return _clip_score((value / benchmark) * 100)


def _industry_key(company_info: Dict[str, Any]) -> str:
    """Pick the benchmark industry key from company information."""
    industry = str(company_info.get("行业分类（国标）") or company_info.get("industry") or "")
    for key in INDUSTRY_BENCHMARKS:
        if key != "default" and key in industry:
            return key
    return "default"


def _funding_signal(funding_events: Optional[List[Dict[str, Any]]], benchmarks: Dict[str, float]) -> float:
    """Calculate the funding signal score from event count and amount."""
    if funding_events is None:
        return 50.0

    event_score = _normalize(float(len(funding_events)), benchmarks["funding_events"])
    amount_total = sum(float(event.get("amount") or 0) for event in funding_events)
    amount_score = _normalize(amount_total, benchmarks["funding_amount_10k"])
    return _clip_score(event_score * 0.45 + amount_score * 0.55)


def _news_proxy_score(
    hiring_data: Optional[Dict[str, Any]], funding_events: Optional[List[Dict[str, Any]]], benchmarks: Dict[str, float]
) -> float:
    """Estimate news mention score from hiring and funding activity."""
    if hiring_data is None and funding_events is None:
        return 50.0

    open_positions = float((hiring_data or {}).get("open_positions") or 0)
    funding_count = float(len(funding_events or []))
    proxy_mentions = open_positions * 0.35 + funding_count * 10
    return _normalize(proxy_mentions, benchmarks["news_mentions"])


def _is_empty_hiring_result(value: Any) -> bool:
    """Return whether a hiring result is the adapter's empty fallback value."""
    return (
        isinstance(value, dict)
        and value.get("open_positions") == 0
        and value.get("avg_salary_min") == 0.0
        and value.get("avg_salary_max") == 0.0
        and value.get("top_job_types") == []
    )


async def calculate_hotness_score(company_name: str) -> Dict[str, Any]:
    """Calculate a normalized company hotness score from multiple data sources.

    The function aggregates Tianyancha basic company data, public hiring signals,
    Patsnap patent signals, and Xiniu/Xenniu funding events. Every upstream call
    is isolated behind exception handling; if one data source fails, its metrics
    are treated as 50% of the industry benchmark instead of failing the whole
    calculation.

    Args:
        company_name: Company name to score.

    Returns:
        A dictionary containing the final 0-100 score and detailed component
        scores: hiring score, patent score, funding signal, news proxy score,
        benchmark industry, and score adjustments.
    """
    query = company_name.strip()
    if not query:
        return {
            "score": 0.0,
            "details": {
                "hiring_score": 0.0,
                "patent_score": 0.0,
                "funding_signal": 0.0,
                "news_score": 0.0,
                "adjustments": ["empty company_name"],
            },
        }

    company_info_result, hiring_result, patent_result, funding_result = await asyncio.gather(
        _safe_call("tianyancha", get_company_basic(query), None),
        _safe_call("zhaopin", get_hiring_count(query), None),
        _safe_call("patent", get_patent_info(query), None),
        _safe_call("funding", get_funding_events(query, months=6), None),
    )

    company_info = company_info_result if isinstance(company_info_result, dict) else {}
    hiring_data = hiring_result if isinstance(hiring_result, dict) else None
    patent_data = patent_result if isinstance(patent_result, dict) else None
    funding_events = funding_result if isinstance(funding_result, list) else None

    # Downstream adapters return empty structures when credentials are missing,
    # robots.txt blocks access, or a vendor API is unavailable. Treat those as
    # missing data so the scoring policy falls back to 50% of benchmark.
    if _is_empty_hiring_result(hiring_result):
        hiring_data = None
    if not settings.patsnap_api_key or not settings.patsnap_secret:
        patent_data = None
    if not settings.xiniu_api_token:
        funding_events = None

    industry = _industry_key(company_info)
    benchmarks = INDUSTRY_BENCHMARKS.get(industry, INDUSTRY_BENCHMARKS["default"])

    hiring_score = _normalize(
        None if hiring_data is None else float(hiring_data.get("open_positions") or 0),
        benchmarks["open_positions"],
    )
    funding_signal = _funding_signal(funding_events, benchmarks)
    patent_growth_rate = None if patent_data is None else float(patent_data.get("inventor_growth_rate") or 0)
    patent_score = _normalize(patent_growth_rate, benchmarks["patent_growth_rate"])
    news_score = _news_proxy_score(hiring_data, funding_events, benchmarks)

    base_score = news_score * 0.25 + hiring_score * 0.3 + funding_signal * 0.25 + patent_score * 0.2
    adjustments: List[str] = []

    if funding_events:
        base_score += 10
        adjustments.append("+10 recent funding in last 6 months")

    # Registration capital change requires Tianyancha change-record API and is intentionally not applied yet.
    if patent_growth_rate is not None and patent_growth_rate > 0.5:
        base_score += 5
        adjustments.append("+5 patent inventor growth > 50%")

    score = _clip_score(base_score)
    return {
        "score": score,
        "details": {
            "hiring_score": hiring_score,
            "patent_score": patent_score,
            "funding_signal": funding_signal,
            "news_score": news_score,
            "industry": industry,
            "adjustments": adjustments,
            "source_status": {
                "tianyancha": company_info_result is not None,
                "zhaopin": hiring_data is not None,
                "patent": patent_data is not None,
                "funding": funding_events is not None,
            },
        },
    }
