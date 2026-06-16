from typing import Any, Dict, List, Optional

import httpx

from config import settings
from services.cache import cache_result


class CompanyNotFound(Exception):
    """Raised when Tianyancha cannot return usable company basic information."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize the exception with optional upstream response context."""
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


def _first_present(data: Dict[str, Any], keys: List[str]) -> Any:
    """Return the first non-empty value from a list of candidate keys."""
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None


def _extract_result(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Extract Tianyancha result data or raise CompanyNotFound."""
    result = payload.get("result") or payload.get("data")
    if not isinstance(result, dict):
        raise CompanyNotFound("Tianyancha did not return company data.", payload=payload)
    return result


def _extract_shareholders(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract up to five normalized shareholder rows."""
    shareholder_candidates = (
        result.get("shareholderList")
        or result.get("holderList")
        or result.get("investorList")
        or result.get("holders")
        or []
    )
    if not isinstance(shareholder_candidates, list):
        return []

    shareholders: List[Dict[str, Any]] = []
    for item in shareholder_candidates[:5]:
        if not isinstance(item, dict):
            continue
        shareholders.append(
            {
                "股东名称": _first_present(item, ["name", "holderName", "shareholderName", "investorName"]),
                "持股比例": _first_present(item, ["percent", "ratio", "capitalRatio", "shareholdingRatio"]),
            }
        )
    return shareholders


@cache_result(ttl_seconds=24 * 60 * 60)
async def get_company_basic(company_name: str) -> Dict[str, Any]:
    """Fetch and normalize company basic information from Tianyancha.

    Calls Tianyancha Open Platform's enterprise basic information endpoint:
    ``GET https://open.api.tianyancha.com/services/open/company/baseinfo``.
    The API token is read from ``settings.tianyancha_api_key`` and sent in the
    ``Authorization`` request header. The company name is sent as the ``keyword``
    query parameter.

    Args:
        company_name: Full or partial company name to query.

    Returns:
        A normalized dictionary containing company full name, unified social
        credit code, legal representative, registered capital, founding date,
        business scope, national-standard industry classification, and the top
        five shareholders with shareholding percentages when available.

    Raises:
        CompanyNotFound: If the API key is missing, the upstream request fails,
        Tianyancha returns an error response, the company cannot be found, or
        the response does not contain usable company data.
    """
    normalized_name = company_name.strip()
    if not normalized_name:
        raise CompanyNotFound("Company name is required.")

    if not settings.tianyancha_api_key:
        raise CompanyNotFound("Missing TIANYANCHA_API_KEY. Add it to .env before calling Tianyancha.")

    url = f"{settings.tianyancha_base_url.rstrip('/')}/services/open/company/baseinfo"
    headers = {"Authorization": settings.tianyancha_api_key}
    params = {"keyword": normalized_name}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.TimeoutException as exc:
        raise CompanyNotFound("Tianyancha request timed out after 5 seconds.") from exc
    except httpx.HTTPStatusError as exc:
        raise CompanyNotFound(
            f"Tianyancha returned HTTP {exc.response.status_code}.",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.HTTPError as exc:
        raise CompanyNotFound("Tianyancha request failed.") from exc
    except ValueError as exc:
        raise CompanyNotFound("Tianyancha returned invalid JSON.") from exc

    if not isinstance(payload, dict):
        raise CompanyNotFound("Tianyancha returned an invalid payload.")

    error_code = payload.get("error_code")
    reason = payload.get("reason") or payload.get("message")
    if error_code not in (None, 0, "0"):
        raise CompanyNotFound(f"Tianyancha API error: {reason or error_code}.", payload=payload)

    result = _extract_result(payload)
    company_full_name = _first_present(result, ["name", "companyName", "alias"])
    if not company_full_name:
        raise CompanyNotFound("Company not found or missing company name.", payload=payload)

    return {
        "企业全称": company_full_name,
        "统一社会信用代码": _first_present(result, ["creditCode", "socialCreditCode", "credit_code"]),
        "法定代表人": _first_present(result, ["legalPersonName", "legalRepresentative", "legalPerson"]),
        "注册资本": _first_present(result, ["regCapital", "registeredCapital"]),
        "成立日期": _first_present(result, ["estiblishTime", "establishTime", "fromTime", "foundDate"]),
        "经营范围": _first_present(result, ["businessScope", "scope"]),
        "行业分类（国标）": _first_present(result, ["industry", "industryAll", "industryCategory", "nationalIndustry"]),
        "股东信息列表": _extract_shareholders(result),
    }
