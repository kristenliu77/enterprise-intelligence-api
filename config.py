import json
import os
from dataclasses import dataclass, field
from typing import Dict, List

from dotenv import load_dotenv


load_dotenv()

_REDIS_DEFAULT = "redis://localhost:6379/0"


def _parse_monitored_companies() -> List[str]:
    """Parse monitored companies from JSON array or comma-separated env value."""
    raw_value = os.getenv("MONITORED_COMPANIES", "")
    if not raw_value:
        return ["腾讯科技有限公司", "小米科技有限责任公司", "武汉华工激光工程有限责任公司"]

    try:
        parsed = json.loads(raw_value)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    return [item.strip() for item in raw_value.split(",") if item.strip()]

INDUSTRY_BENCHMARKS: Dict[str, Dict[str, float]] = {
    "default": {
        "news_mentions": 20.0,
        "open_positions": 30.0,
        "funding_events": 1.0,
        "funding_amount_10k": 1000.0,
        "patent_growth_rate": 0.2,
    },
    "互联网": {
        "news_mentions": 40.0,
        "open_positions": 80.0,
        "funding_events": 2.0,
        "funding_amount_10k": 5000.0,
        "patent_growth_rate": 0.25,
    },
    "人工智能": {
        "news_mentions": 50.0,
        "open_positions": 60.0,
        "funding_events": 2.0,
        "funding_amount_10k": 8000.0,
        "patent_growth_rate": 0.35,
    },
    "生物医药": {
        "news_mentions": 30.0,
        "open_positions": 35.0,
        "funding_events": 1.0,
        "funding_amount_10k": 6000.0,
        "patent_growth_rate": 0.3,
    },
    "制造业": {
        "news_mentions": 20.0,
        "open_positions": 45.0,
        "funding_events": 1.0,
        "funding_amount_10k": 3000.0,
        "patent_growth_rate": 0.2,
    },
}


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    app_name: str = os.getenv("APP_NAME", "Enterprise Intelligence API")
    app_version: str = os.getenv("APP_VERSION", "0.1.0")
    environment: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"}

    redis_url: str = os.getenv("REDIS_URL", _REDIS_DEFAULT)
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", _REDIS_DEFAULT))
    celery_result_backend: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/1"))
    monitored_companies: List[str] = field(default_factory=_parse_monitored_companies)
    hotness_results_file: str = os.getenv("HOTNESS_RESULTS_FILE", "hotness_scores.json")

    tianyancha_api_key: str = os.getenv("TIANYANCHA_API_KEY", "")
    patsnap_api_key: str = os.getenv("PATSNAP_API_KEY", "")
    patsnap_secret: str = os.getenv("PATSNAP_SECRET", "")
    xiniu_api_token: str = os.getenv("XINIU_API_TOKEN", os.getenv("XENNIU_API_TOKEN", os.getenv("XINIU_API_KEY", "")))

    tianyancha_base_url: str = os.getenv("TIANYANCHA_BASE_URL", "https://open.api.tianyancha.com")
    patsnap_base_url: str = os.getenv("PATSNAP_BASE_URL", "https://api.patsnap.com")
    patsnap_patent_search_path: str = os.getenv("PATSNAP_PATENT_SEARCH_PATH", "/v1/patent-search")
    xiniu_base_url: str = os.getenv("XINIU_BASE_URL", os.getenv("XENNIU_BASE_URL", "https://api.xiniudata.com"))
    xiniu_funding_path: str = os.getenv("XINIU_FUNDING_PATH", os.getenv("XENNIU_FUNDING_PATH", "/openapi/company/funding-events"))
    exchange_rate_api_url: str = os.getenv("EXCHANGE_RATE_API_URL", "https://open.er-api.com/v6/latest/{currency}")

    def get_missing_key_warnings(self) -> List[str]:
        """Return warnings for missing external data-source credentials."""
        required_keys = {
            "TIANYANCHA_API_KEY": self.tianyancha_api_key,
            "PATSNAP_API_KEY": self.patsnap_api_key,
            "PATSNAP_SECRET": self.patsnap_secret,
            "XINIU_API_TOKEN": self.xiniu_api_token,
        }
        warnings: List[str] = []
        for env_name, value in required_keys.items():
            if not value:
                warnings.append(
                    f"[config warning] Missing {env_name}. Add it to .env before using the related data service."
                )
        return warnings


settings = Settings()
