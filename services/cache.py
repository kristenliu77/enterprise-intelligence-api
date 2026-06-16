import functools
import hashlib
import inspect
import json
import logging
from typing import Any, Callable

import redis

from config import settings


logger = logging.getLogger(__name__)


def _redis_client() -> redis.Redis:
    """Create a Redis client from application settings."""
    return redis.Redis.from_url(settings.redis_url, decode_responses=True)


def _cache_key(function: Callable[..., Any], args: tuple, kwargs: dict) -> str:
    """Build a stable cache key from function identity and arguments."""
    payload = {
        "function": f"{function.__module__}.{function.__qualname__}",
        "args": args,
        "kwargs": kwargs,
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"cache:{function.__module__}.{function.__name__}:{digest}"


def _get_cached(client: redis.Redis, key: str) -> Any:
    """Load and decode a cached JSON value."""
    cached = client.get(key)
    if cached is None:
        return None
    return json.loads(cached)


def _set_cached(client: redis.Redis, key: str, value: Any, ttl_seconds: int) -> None:
    """Encode and store a value in Redis with a TTL."""
    client.setex(key, ttl_seconds, json.dumps(value, ensure_ascii=False, default=str))


def cache_result(ttl_seconds: int) -> Callable:
    """Cache a function result in Redis as JSON.

    The key is based on function name plus a hash of positional and keyword
    arguments. Redis failures are logged and bypassed so external data access
    keeps working when cache infrastructure is unavailable.
    """

    def decorator(function: Callable[..., Any]) -> Callable[..., Any]:
        """Wrap a sync or async function with Redis caching."""
        if inspect.iscoroutinefunction(function):

            @functools.wraps(function)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                """Return cached async result or execute and cache the function."""
                key = _cache_key(function, args, kwargs)
                try:
                    client = _redis_client()
                    cached = _get_cached(client, key)
                    if cached is not None:
                        return cached
                except (redis.RedisError, json.JSONDecodeError) as exc:
                    logger.warning("Redis cache read bypassed for %s: %s", function.__name__, exc)

                result = await function(*args, **kwargs)

                try:
                    client = _redis_client()
                    _set_cached(client, key, result, ttl_seconds)
                except (redis.RedisError, TypeError, ValueError) as exc:
                    logger.warning("Redis cache write bypassed for %s: %s", function.__name__, exc)
                return result

            return async_wrapper

        @functools.wraps(function)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            """Return cached sync result or execute and cache the function."""
            key = _cache_key(function, args, kwargs)
            try:
                client = _redis_client()
                cached = _get_cached(client, key)
                if cached is not None:
                    return cached
            except (redis.RedisError, json.JSONDecodeError) as exc:
                logger.warning("Redis cache read bypassed for %s: %s", function.__name__, exc)

            result = function(*args, **kwargs)

            try:
                client = _redis_client()
                _set_cached(client, key, result, ttl_seconds)
            except (redis.RedisError, TypeError, ValueError) as exc:
                logger.warning("Redis cache write bypassed for %s: %s", function.__name__, exc)
            return result

        return sync_wrapper

    return decorator
