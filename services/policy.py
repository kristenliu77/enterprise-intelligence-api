import json
import logging
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
POLICIES_FILE = PROJECT_ROOT / "policies.json"
NEGOTIATED_POLICY_NAME = "一事一议"


def load_policies() -> List[Dict[str, Any]]:
    """Load structured subsidy policies from ``policies.json``.

    Returns:
        A list of policy dictionaries. If the file is missing, invalid, or does
        not contain a JSON array, an empty list is returned and the problem is
        logged.
    """
    if not POLICIES_FILE.exists():
        logger.warning("Policy file not found: %s", POLICIES_FILE)
        return []

    try:
        with POLICIES_FILE.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load policy file %s: %s", POLICIES_FILE, exc)
        return []

    if not isinstance(payload, list):
        logger.warning("Policy file %s must contain a JSON array.", POLICIES_FILE)
        return []

    return [policy for policy in payload if isinstance(policy, dict)]


def _matches_industry(policy: Dict[str, Any], company_type: str) -> bool:
    """Return whether a policy's industry keywords match a company type."""
    normalized_company_type = company_type.strip().lower()
    if not normalized_company_type:
        return False

    keywords = policy.get("industry_keywords") or []
    if not isinstance(keywords, list):
        return False

    for keyword in keywords:
        normalized_keyword = str(keyword).strip().lower()
        if normalized_keyword and (
            normalized_keyword in normalized_company_type or normalized_company_type in normalized_keyword
        ):
            return True
    return False


def _is_effective(policy: Dict[str, Any], today: Optional[date] = None) -> bool:
    """Return whether a policy is currently within its valid period."""
    today = today or date.today()
    valid_from = _parse_date(policy.get("valid_from"))
    valid_to = _parse_date(policy.get("valid_to"))
    if valid_from and today < valid_from:
        return False
    if valid_to and today > valid_to:
        return False
    return True


def _parse_date(value: Any) -> Optional[date]:
    """Parse an ISO date value from policy JSON."""
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _investment_status(policy: Dict[str, Any], investment_amount: float) -> str:
    """Classify investment amount against a policy's investment range."""
    investment_range = policy.get("investment_range") or {}
    min_amount = investment_range.get("min")
    max_amount = investment_range.get("max")

    if min_amount is not None and investment_amount < float(min_amount):
        return "below_min"
    if max_amount is not None and investment_amount > float(max_amount):
        return "above_max"
    return "eligible"


def _estimate_subsidy(policy: Dict[str, Any], investment_amount: float) -> Dict[str, float]:
    """Estimate min and max subsidy amounts for one policy."""
    subsidy = policy.get("subsidy") or {}
    cap = float(policy.get("cap") or 0)
    mode = subsidy.get("mode")

    if mode == "ratio":
        amount = investment_amount * float(subsidy.get("value") or 0)
        amount = min(amount, cap) if cap else amount
        return {"min": amount, "max": amount}

    if mode == "fixed":
        amount = float(subsidy.get("value") or 0)
        amount = min(amount, cap) if cap else amount
        return {"min": amount, "max": amount}

    if mode == "fixed_range":
        min_amount = float(subsidy.get("min") or 0)
        max_amount = float(subsidy.get("max") or 0)
        if cap:
            min_amount = min(min_amount, cap)
            max_amount = min(max_amount, cap)
        return {"min": min_amount, "max": max_amount}

    return {"min": 0.0, "max": 0.0}


def _priority(policy: Dict[str, Any], amount_range: Dict[str, float]) -> float:
    """Calculate application priority weight for a policy."""
    level_weight = 2 if policy.get("level") == "区" else 1
    certainty_weight = 1 if not policy.get("competitive", False) else 0
    return amount_range["max"] + level_weight * 10 + certainty_weight * 5


def calculate_policy_package(company_type: str, investment_amount: float) -> Dict[str, Any]:
    """Calculate eligible subsidy package for a company type and investment size.

    ``investment_amount`` is interpreted as ten-thousand CNY. Policy amounts in
    ``policies.json`` use the same unit.
    """
    policies = load_policies()
    eligible_policies: List[Dict[str, Any]] = []
    priority_candidates: List[Dict[str, Any]] = []
    above_max_matches: List[str] = []

    for policy in policies:
        if not _matches_industry(policy, company_type):
            continue
        if not _is_effective(policy):
            continue

        investment_status = _investment_status(policy, investment_amount)
        if investment_status == "below_min":
            continue
        if investment_status == "above_max":
            above_max_matches.append(str(policy.get("name") or "未命名政策"))
            continue

        amount_range = _estimate_subsidy(policy, investment_amount)
        competitive = bool(policy.get("competitive", False))
        amount_min = 0.0 if competitive else amount_range["min"]
        amount_max = amount_range["max"]

        item = {
            "name": str(policy.get("name") or "未命名政策"),
            "level": str(policy.get("level") or ""),
            "subsidy_type": str(policy.get("subsidy_type") or ""),
            "amount": round(amount_max, 2),
            "amount_min": round(amount_min, 2),
            "amount_max": round(amount_max, 2),
            "competitive": competitive,
            "source_url": str(policy.get("source_url") or ""),
        }
        eligible_policies.append(item)
        priority_candidates.append({"name": item["name"], "priority": _priority(policy, amount_range)})

    total_min = round(sum(float(policy["amount_min"]) for policy in eligible_policies), 2)
    total_max = round(sum(float(policy["amount_max"]) for policy in eligible_policies), 2)
    application_priority = [
        item["name"] for item in sorted(priority_candidates, key=lambda item: item["priority"], reverse=True)
    ]

    if above_max_matches:
        application_priority.append(
            f"投资额超过部分政策区间，建议申请“{NEGOTIATED_POLICY_NAME}”：{', '.join(above_max_matches[:3])}"
        )
    elif investment_amount >= 10000:
        application_priority.append(f"投资额较大，建议同步准备“{NEGOTIATED_POLICY_NAME}”沟通材料")

    return {
        "eligible_policies": eligible_policies,
        "total_min": total_min,
        "total_max": total_max,
        "application_priority": application_priority,
    }
