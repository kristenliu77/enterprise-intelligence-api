import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote, urlparse

import httpx

from services.cache import cache_result


logger = logging.getLogger(__name__)

DEFAULT_HIRING_RESULT: Dict[str, Any] = {
    "open_positions": 0,
    "avg_salary_min": 0.0,
    "avg_salary_max": 0.0,
    "top_job_types": [],
}

BOSS_HOST = "https://www.zhipin.com"
BOSS_ROBOTS_URL = f"{BOSS_HOST}/robots.txt"
BOSS_SEARCH_URL = f"{BOSS_HOST}/wapi/zpgeek/search/job"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)
REQUEST_INTERVAL_SECONDS = 1.5
MAX_RETRIES = 3
RECENT_DAYS = 30


def _empty_result() -> Dict[str, Any]:
    """Return the empty hiring metrics response."""
    return dict(DEFAULT_HIRING_RESULT)


def _robots_disallows(robots_text: str, target_url: str, user_agent: str = "*") -> bool:
    """Return whether robots.txt disallows the target URL for the given agent.

    This implements the subset needed here, including the wildcard patterns used
    by zhipin.com such as ``/*?query=*`` and ``/*?*``.
    """
    parsed_target = urlparse(target_url)
    target_path = parsed_target.path
    if parsed_target.query:
        target_path = f"{target_path}?{parsed_target.query}"

    active = False
    disallow_rules: List[str] = []
    for raw_line in robots_text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue

        key, value = [part.strip() for part in line.split(":", 1)]
        key = key.lower()
        if key == "user-agent":
            active = value == "*" or value.lower() == user_agent.lower()
        elif active and key == "disallow" and value:
            disallow_rules.append(value)

    for rule in disallow_rules:
        pattern = "^" + re.escape(rule).replace("\\*", ".*")
        if re.search(pattern, target_path):
            return True
    return False


async def _is_allowed_by_robots(client: httpx.AsyncClient, target_url: str) -> bool:
    """Check whether BOSS robots.txt allows the target URL."""
    try:
        response = await client.get(BOSS_ROBOTS_URL, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Failed to fetch BOSS robots.txt: %s", exc)
        return False

    if _robots_disallows(response.text, target_url):
        logger.warning("BOSS robots.txt disallows fetching URL: %s", target_url)
        return False
    return True


def _find_job_list(payload: Any) -> List[Dict[str, Any]]:
    """Find job rows in common BOSS response shapes."""
    if isinstance(payload, dict):
        for key in ("jobList", "jobs", "list", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]

        for value in payload.values():
            found = _find_job_list(value)
            if found:
                return found

    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    return []


def _parse_publish_date(job: Dict[str, Any]) -> Optional[datetime]:
    """Parse a BOSS job publish date into a datetime."""
    value = (
        job.get("publishTime")
        or job.get("lastModifyTime")
        or job.get("updateTime")
        or job.get("date")
        or job.get("jobDate")
    )
    if value is None:
        return None

    if isinstance(value, (int, float)):
        timestamp = value / 1000 if value > 10_000_000_000 else value
        return datetime.fromtimestamp(timestamp)

    text = str(value).strip()
    now = datetime.now()
    if text in {"今天", "刚刚"}:
        return now
    if text == "昨天":
        return now - timedelta(days=1)

    days_match = re.search(r"(\d+)\s*天前", text)
    if days_match:
        return now - timedelta(days=int(days_match.group(1)))

    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%m-%d", "%m.%d"):
        try:
            parsed = datetime.strptime(text, fmt)
            if "%Y" not in fmt:
                parsed = parsed.replace(year=now.year)
            return parsed
        except ValueError:
            continue

    return None


def _parse_salary(job: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    """Parse a salary range from a BOSS job row."""
    raw_salary = job.get("salaryDesc") or job.get("salary") or job.get("salaryText")
    if not raw_salary:
        return None

    text = str(raw_salary).replace(" ", "")
    range_match = re.search(r"(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(K|k|千|万)?", text)
    if not range_match:
        return None

    salary_min = float(range_match.group(1))
    salary_max = float(range_match.group(2))
    unit = range_match.group(3)
    if unit in {"K", "k", "千"}:
        salary_min *= 1000
        salary_max *= 1000
    elif unit == "万":
        salary_min *= 10000
        salary_max *= 10000

    months_match = re.search(r"[·xX*](\d+)薪", text)
    if months_match:
        months = int(months_match.group(1))
        salary_min = salary_min * months / 12
        salary_max = salary_max * months / 12

    return salary_min, salary_max


def _job_type(job: Dict[str, Any]) -> str:
    """Return the best available job type label."""
    return str(
        job.get("jobType")
        or job.get("positionCategory")
        or job.get("jobCategory")
        or job.get("jobName")
        or job.get("positionName")
        or "未分类"
    )


def _summarize_jobs(jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Summarize recent job count, average salary, and top job types."""
    cutoff = datetime.now() - timedelta(days=RECENT_DAYS)
    recent_jobs: List[Dict[str, Any]] = []
    salaries: List[Tuple[float, float]] = []
    type_counts: Dict[str, int] = {}

    for job in jobs:
        publish_date = _parse_publish_date(job)
        if publish_date is not None and publish_date < cutoff:
            continue

        recent_jobs.append(job)

        parsed_salary = _parse_salary(job)
        if parsed_salary:
            salaries.append(parsed_salary)

        job_type = _job_type(job)
        type_counts[job_type] = type_counts.get(job_type, 0) + 1

    if salaries:
        avg_salary_min = sum(item[0] for item in salaries) / len(salaries)
        avg_salary_max = sum(item[1] for item in salaries) / len(salaries)
    else:
        avg_salary_min = 0.0
        avg_salary_max = 0.0

    top_job_types = [
        job_type for job_type, _ in sorted(type_counts.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    return {
        "open_positions": len(recent_jobs),
        "avg_salary_min": round(avg_salary_min, 2),
        "avg_salary_max": round(avg_salary_max, 2),
        "top_job_types": top_job_types,
    }


@cache_result(ttl_seconds=60 * 60)
async def get_hiring_count(company_name: str) -> Dict[str, Any]:
    """Fetch and summarize public hiring information from BOSS Zhipin.

    The function checks ``https://www.zhipin.com/robots.txt`` before requesting
    the company job search endpoint. If robots.txt disallows the query URL, the
    search request is skipped, a warning is logged, and a default empty result is
    returned. Network failures, invalid JSON, blocked responses, and unexpected
    payload shapes are handled defensively and also return the same default
    result.

    Args:
        company_name: Company keyword used for the BOSS Zhipin job search query.

    Returns:
        A dictionary with ``open_positions`` for jobs published in the latest 30
        days, average minimum and maximum salary values, and up to five hottest
        job categories.
    """
    query = company_name.strip()
    if not query:
        logger.warning("BOSS hiring query skipped because company_name is empty.")
        return _empty_result()

    target_url = f"{BOSS_SEARCH_URL}?query={quote(query)}"
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json, text/plain, */*",
        "Referer": f"{BOSS_HOST}/",
    }

    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        if not await _is_allowed_by_robots(client, target_url):
            return _empty_result()

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                await asyncio.sleep(REQUEST_INTERVAL_SECONDS)
                response = await client.get(BOSS_SEARCH_URL, headers=headers, params={"query": query})
                response.raise_for_status()
                payload = response.json()
                jobs = _find_job_list(payload)
                if not jobs:
                    logger.info("BOSS response contained no job list for company: %s", query)
                    return _empty_result()
                return _summarize_jobs(jobs)
            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.HTTPError, ValueError) as exc:
                logger.warning("BOSS hiring request failed on attempt %s/%s: %s", attempt, MAX_RETRIES, exc)
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2 ** (attempt - 1))
            except Exception:
                logger.exception("Unexpected error while fetching BOSS hiring count for %s", query)
                return _empty_result()

    return _empty_result()
