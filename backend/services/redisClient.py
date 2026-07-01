import os
import logging
from redis.asyncio import Redis, ConnectionPool
from redis.asyncio.retry import Retry
from redis.backoff import ExponentialBackoff
from redis.exceptions import ResponseError, ConnectionError, TimeoutError

# Use standard logging instead of blocking traceback prints
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL") or "redis://127.0.0.1:6379/0"

# 1. Explicit Connection Pool
# 15,000 users do not need 15,000 connections. A pool of 500 is more than enough 
# to multiplex 1,000 RPS in an async event loop without overwhelming Redis.
pool = ConnectionPool.from_url(
    REDIS_URL,
    decode_responses=True,
    max_connections=500,          # Throttles max open connections
    socket_connect_timeout=2.0,   # Fail fast if Redis is down (2 seconds)
    socket_timeout=0.5,           # CRITICAL: Drop queries that take >500ms
    health_check_interval=30,
)

# 2. Resilient Retry Strategy
# If a network blip drops a connection, automatically retry up to 3 times 
# using exponential backoff (starting at 10ms, max 100ms) before surfacing the error.
retry_strategy = Retry(ExponentialBackoff(cap=0.1, base=0.01), retries=3)

redis = Redis(
    connection_pool=pool,
    retry=retry_strategy,
    retry_on_error=[ConnectionError, TimeoutError, OSError]
)


def get_redis() -> Redis:
    """Dependency injection function to get the Redis client"""
    return redis


async def disconnect_redis():
    """Gracefully close all connections in the pool"""
    logger.info("Closing Redis connection pool...")
    # modern redis.asyncio uses aclose() to cleanly shut down the pool
    await redis.aclose() 


async def ensure_stream_group(stream: str, group: str):
    """Ensure a Redis Stream consumer group exists."""
    redis_client = get_redis()

    try:
        await redis_client.xgroup_create(
            name=stream,
            groupname=group,
            id="0",
            mkstream=True,
        )
    except ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            logger.error(f"Failed to create group '{group}' on stream '{stream}': {exc}")
            raise