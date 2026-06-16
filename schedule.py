import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings
from services.hotness import calculate_hotness_score


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent
SCHEDULER_TIMEZONE = ZoneInfo("Asia/Shanghai")
_scheduler: AsyncIOScheduler = None


def _results_path() -> Path:
    """Resolve the JSON output path for scheduled hotness results."""
    configured = Path(settings.hotness_results_file)
    if configured.is_absolute():
        return configured
    return PROJECT_ROOT / configured


async def refresh_monitored_hotness_scores() -> Dict[str, Any]:
    """Refresh monitored company hotness scores and persist them to JSON."""
    results = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "companies": [],
    }

    for company_name in settings.monitored_companies:
        try:
            score = await calculate_hotness_score(company_name)
            results["companies"].append({"company_name": company_name, "result": score, "error": None})
        except Exception as exc:
            logger.exception("Failed to refresh hotness score for %s", company_name)
            results["companies"].append({"company_name": company_name, "result": None, "error": str(exc)})

    output_path = _results_path()
    temp_path = output_path.with_suffix(f"{output_path.suffix}.tmp")
    temp_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    temp_path.replace(output_path)
    return results


def start_scheduler() -> AsyncIOScheduler:
    """Start the daily hotness refresh scheduler if it is not already running."""
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    _scheduler = AsyncIOScheduler(timezone=SCHEDULER_TIMEZONE)
    _scheduler.add_job(
        refresh_monitored_hotness_scores,
        CronTrigger(hour=2, minute=0, timezone=SCHEDULER_TIMEZONE),
        id="daily_hotness_refresh",
        name="Daily monitored company hotness refresh",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info("Scheduler started with monitored companies: %s", settings.monitored_companies)
    return _scheduler


def shutdown_scheduler() -> None:
    """Stop the scheduler during application shutdown."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
