import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator, Dict

from fastapi import FastAPI, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from config import settings
from logging_config import configure_logging
from schedule import shutdown_scheduler, start_scheduler
from services.benchmark import get_radar_data
from services.hotness import calculate_hotness_score
from services.industry_chain import match_chain
from services.policy import calculate_policy_package
from services.tianyancha import get_company_basic


configure_logging()
logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parent
STATIC_DIR = PROJECT_ROOT / "static"


class HotnessRequest(BaseModel):
    """Request body for company hotness calculation."""

    company_name: str = Field(..., min_length=1)

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str) -> str:
        """Trim and validate company name input."""
        value = value.strip()
        if not value:
            raise ValueError("company_name is required")
        return value


class PolicyCalcRequest(BaseModel):
    """Request body for policy package calculation."""

    company_type: str = Field(..., min_length=1)
    investment_amount: float = Field(..., ge=0)

    @field_validator("company_type")
    @classmethod
    def validate_company_type(cls, value: str) -> str:
        """Trim and validate company type input."""
        value = value.strip()
        if not value:
            raise ValueError("company_type is required")
        return value


class FullAnalysisRequest(BaseModel):
    """Request body for full company analysis."""

    company_name: str = Field(..., min_length=1)
    investment_amount: float = Field(..., ge=0)

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str) -> str:
        """Trim and validate company name input."""
        value = value.strip()
        if not value:
            raise ValueError("company_name is required")
        return value


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run application startup and shutdown hooks."""
    for warning in settings.get_missing_key_warnings():
        logger.warning(warning)
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Enterprise intelligence API for company data, market heat, "
        "patents, policies, and recruitment signals."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    """Return validation errors in the unified API error format."""
    first_error = exc.errors()[0] if exc.errors() else {}
    location = ".".join(str(part) for part in first_error.get("loc", []) if part not in {"body", "query"})
    message = first_error.get("msg", "Invalid request")
    if location:
        message = f"{location}: {message}"
    return JSONResponse(status_code=422, content={"error": message})


@app.exception_handler(Exception)
async def generic_exception_handler(_, exc: Exception) -> JSONResponse:
    """Return unhandled exceptions in the unified API error format."""
    logger.exception("Unhandled application error")
    return JSONResponse(status_code=500, content={"error": str(exc) or "Internal server error"})


@app.get("/health")
async def health() -> dict:
    """Return service health status."""
    return {"status": "ok"}


@app.get("/", response_class=FileResponse)
async def index() -> FileResponse:
    """Serve the browser-based analysis console."""
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/hotness")
async def hotness(request: HotnessRequest) -> Dict[str, Any]:
    """Calculate company hotness score."""
    return await calculate_hotness_score(request.company_name)


@app.get("/match")
async def match(
    industry: str = Query(..., min_length=1),
    sub_sector: str = Query(..., min_length=1),
) -> Dict[str, Any]:
    """Match company industry and sub-sector to an industry chain gap."""
    return match_chain(industry.strip(), sub_sector.strip())


@app.post("/policy-calc")
async def policy_calc(request: PolicyCalcRequest) -> Dict[str, Any]:
    """Calculate eligible policy subsidy package."""
    return calculate_policy_package(request.company_type, request.investment_amount)


@app.get("/radar")
async def radar() -> Dict[str, Any]:
    """Return competitor park radar chart data."""
    return get_radar_data()


async def _company_context(company_name: str) -> Dict[str, str]:
    """Load company industry context for full analysis."""
    try:
        company_basic = await get_company_basic(company_name)
    except Exception as exc:
        logger.info("Company context fallback used for %s: %s", company_name, exc)
        company_basic = {}

    industry = str(company_basic.get("行业分类（国标）") or company_basic.get("行业分类") or "新一代信息技术")
    sub_sector = str(company_basic.get("经营范围") or industry or company_name)
    return {"industry": industry, "sub_sector": sub_sector}


@app.post("/full-analysis")
async def full_analysis(request: FullAnalysisRequest) -> Dict[str, Any]:
    """Run hotness, chain matching, and policy calculations together."""
    context = await _company_context(request.company_name)
    hotness_task = calculate_hotness_score(request.company_name)
    match_task = asyncio.to_thread(match_chain, context["industry"], context["sub_sector"])
    policy_task = asyncio.to_thread(calculate_policy_package, context["industry"], request.investment_amount)

    hotness_result, match_result, policy_result = await asyncio.gather(hotness_task, match_task, policy_task)
    return {
        "company_name": request.company_name,
        "investment_amount": request.investment_amount,
        "company_context": context,
        "hotness": hotness_result,
        "chain_match": match_result,
        "policy_package": policy_result,
    }
