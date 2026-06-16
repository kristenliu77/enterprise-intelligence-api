import json
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PARKS_DATA_FILE = PROJECT_ROOT / "parks_data.json"

DIMENSIONS = ["产业基础", "人才储备", "政策力度", "生活成本", "融资环境", "创新生态"]

METRIC_DIRECTIONS = {
    "industrial_base": 1,
    "talent_reserve": 1,
    "policy_strength": 1,
    "living_cost": -1,
    "financing_environment": 1,
    "innovation_ecology": 1,
}

METRIC_TO_DIMENSION = {
    "industrial_base": "产业基础",
    "talent_reserve": "人才储备",
    "policy_strength": "政策力度",
    "living_cost": "生活成本",
    "financing_environment": "融资环境",
    "innovation_ecology": "创新生态",
}

FALLBACK_DATA: Dict[str, Any] = {
    "updated_at": "fallback",
    "note": "Fallback sample values. Update parks_data.json with latest manually collected official data.",
    "parks": [
        {
            "name": "光谷",
            "high_tech_enterprises": 6200,
            "leading_industrial_clusters": 6,
            "average_salary_monthly": 14500,
            "university_students_nearby": 1300000,
            "policy_subsidy_cap_10k": 10000,
            "policy_count": 42,
            "average_office_rent_yuan_m2_day": 2.8,
            "average_apartment_rent_yuan_month": 2600,
            "vc_events_yearly": 320,
            "vc_amount_100m": 580,
            "national_incubators": 28,
            "patents_yearly": 54000,
        },
        {
            "name": "张江",
            "high_tech_enterprises": 5200,
            "leading_industrial_clusters": 5,
            "average_salary_monthly": 21000,
            "university_students_nearby": 780000,
            "policy_subsidy_cap_10k": 8000,
            "policy_count": 36,
            "average_office_rent_yuan_m2_day": 5.8,
            "average_apartment_rent_yuan_month": 5200,
            "vc_events_yearly": 460,
            "vc_amount_100m": 900,
            "national_incubators": 24,
            "patents_yearly": 48000,
        },
        {
            "name": "苏州工业园",
            "high_tech_enterprises": 4100,
            "leading_industrial_clusters": 5,
            "average_salary_monthly": 15500,
            "university_students_nearby": 620000,
            "policy_subsidy_cap_10k": 6000,
            "policy_count": 34,
            "average_office_rent_yuan_m2_day": 3.5,
            "average_apartment_rent_yuan_month": 3400,
            "vc_events_yearly": 260,
            "vc_amount_100m": 420,
            "national_incubators": 22,
            "patents_yearly": 42000,
        },
        {
            "name": "合肥高新区",
            "high_tech_enterprises": 2700,
            "leading_industrial_clusters": 4,
            "average_salary_monthly": 12800,
            "university_students_nearby": 850000,
            "policy_subsidy_cap_10k": 5000,
            "policy_count": 30,
            "average_office_rent_yuan_m2_day": 2.2,
            "average_apartment_rent_yuan_month": 2200,
            "vc_events_yearly": 190,
            "vc_amount_100m": 310,
            "national_incubators": 18,
            "patents_yearly": 30000,
        },
    ],
}

_RADAR_CACHE: Dict[str, Any] = {}


def _load_parks_data() -> Tuple[List[Dict[str, Any]], bool]:
    """Load park benchmark data from JSON or fallback defaults."""
    if not PARKS_DATA_FILE.exists():
        logger.warning("Parks data file not found: %s. Using fallback defaults that need updating.", PARKS_DATA_FILE)
        return FALLBACK_DATA["parks"], True

    try:
        with PARKS_DATA_FILE.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load parks data file %s: %s. Using fallback defaults.", PARKS_DATA_FILE, exc)
        return FALLBACK_DATA["parks"], True

    parks = payload.get("parks") if isinstance(payload, dict) else None
    if not isinstance(parks, list):
        logger.warning("Parks data file %s must contain a parks array. Using fallback defaults.", PARKS_DATA_FILE)
        return FALLBACK_DATA["parks"], True

    valid_parks = [park for park in parks if isinstance(park, dict) and park.get("name")]
    if not valid_parks:
        logger.warning("Parks data file %s contained no valid park rows. Using fallback defaults.", PARKS_DATA_FILE)
        return FALLBACK_DATA["parks"], True

    return valid_parks, False


def _number(park: Dict[str, Any], key: str) -> float:
    """Read a numeric park metric with defensive conversion."""
    try:
        return float(park.get(key) or 0)
    except (TypeError, ValueError):
        return 0.0


def _raw_dimension_metrics(park: Dict[str, Any]) -> Dict[str, float]:
    """Convert raw park fields into six comparable dimension metrics."""
    return {
        "industrial_base": _number(park, "high_tech_enterprises") * 0.75
        + _number(park, "leading_industrial_clusters") * 500,
        "talent_reserve": _number(park, "average_salary_monthly") * 0.45
        + _number(park, "university_students_nearby") / 100,
        "policy_strength": _number(park, "policy_subsidy_cap_10k") * 0.65 + _number(park, "policy_count") * 80,
        "living_cost": _number(park, "average_office_rent_yuan_m2_day") * 500
        + _number(park, "average_apartment_rent_yuan_month"),
        "financing_environment": _number(park, "vc_events_yearly") * 2.5 + _number(park, "vc_amount_100m") * 8,
        "innovation_ecology": _number(park, "national_incubators") * 700 + _number(park, "patents_yearly") * 0.35,
    }


def _normalize_columns(rows: List[Dict[str, float]]) -> List[Dict[str, float]]:
    """Normalize each metric column to a benefit-oriented 0-1 range."""
    normalized_rows: List[Dict[str, float]] = [{metric: 0.0 for metric in METRIC_DIRECTIONS} for _ in rows]
    for metric, direction in METRIC_DIRECTIONS.items():
        values = [row[metric] for row in rows]
        min_value = min(values)
        max_value = max(values)
        span = max_value - min_value
        for index, value in enumerate(values):
            if span == 0:
                normalized = 1.0
            elif direction > 0:
                normalized = (value - min_value) / span
            else:
                normalized = (max_value - value) / span
            normalized_rows[index][metric] = normalized
    return normalized_rows


def _entropy_weights(normalized_rows: List[Dict[str, float]]) -> Dict[str, float]:
    """Calculate entropy weights for normalized metric rows."""
    metrics = list(METRIC_DIRECTIONS.keys())
    row_count = len(normalized_rows)
    if row_count <= 1:
        return {metric: 1 / len(metrics) for metric in metrics}

    entropy_factor = 1 / math.log(row_count)
    diversities: Dict[str, float] = {}
    epsilon = 1e-12
    for metric in metrics:
        adjusted_values = [row[metric] + epsilon for row in normalized_rows]
        total = sum(adjusted_values)
        proportions = [value / total for value in adjusted_values]
        entropy = -entropy_factor * sum(proportion * math.log(proportion) for proportion in proportions)
        diversities[metric] = max(0.0, 1 - entropy)

    diversity_total = sum(diversities.values())
    if diversity_total == 0:
        return {metric: 1 / len(metrics) for metric in metrics}
    return {metric: diversities[metric] / diversity_total for metric in metrics}


def _scores(normalized_rows: List[Dict[str, float]], weights: Dict[str, float]) -> List[Dict[str, float]]:
    """Convert normalized rows and entropy weights into 0-100 radar scores."""
    scores: List[Dict[str, float]] = []
    for row in normalized_rows:
        weighted_scores: Dict[str, float] = {}
        for metric, normalized_value in row.items():
            # Keep each radar axis on a 0-100 scale while entropy weights still
            # influence the spread of dimensions across parks.
            weighted_scores[METRIC_TO_DIMENSION[metric]] = round(
                normalized_value * 100 * (0.5 + weights[metric] * 3),
                2,
            )
        scores.append(weighted_scores)

    for dimension in DIMENSIONS:
        max_score = max(row[dimension] for row in scores) or 1
        for row in scores:
            row[dimension] = round(min(100.0, row[dimension] / max_score * 100), 2)
    return scores


def _calculate_radar_data() -> Dict[str, Any]:
    """Build the ECharts radar data payload from park metrics."""
    parks, _ = _load_parks_data()
    raw_rows = [_raw_dimension_metrics(park) for park in parks]
    normalized_rows = _normalize_columns(raw_rows)
    weights = _entropy_weights(normalized_rows)
    score_rows = _scores(normalized_rows, weights)

    return {
        "indicator": [{"name": dimension, "max": 100} for dimension in DIMENSIONS],
        "series": [
            {"name": str(park["name"]), "value": [score_row[dimension] for dimension in DIMENSIONS]}
            for park, score_row in zip(parks, score_rows)
        ],
    }


def refresh_radar_data() -> Dict[str, Any]:
    """Reload ``parks_data.json`` and recalculate ECharts radar data."""
    global _RADAR_CACHE
    _RADAR_CACHE = _calculate_radar_data()
    return _RADAR_CACHE


def get_radar_data() -> Dict[str, Any]:
    """Return ECharts radar chart data for Optics Valley competitor parks."""
    if not _RADAR_CACHE:
        return refresh_radar_data()
    return _RADAR_CACHE
