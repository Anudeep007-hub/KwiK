import os
import traceback

from redis.asyncio import Redis
from redis.exceptions import ResponseError


REDIS_URL = os.getenv("REDIS_URL") or "redis://127.0.0.1:6379/0"

redis = Redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=10,
    socket_timeout=None,
    health_check_interval=30,
)


def get_redis():
    return redis


async def disconnect_redis():
    await redis.connection_pool.disconnect(inuse_connections=True)


async def ensure_stream_group(stream: str, group: str):
    redis_client = get_redis()

    try:
        await redis_client.xgroup_create(
            name=stream,
            groupname=group,
            id="0",
            mkstream=True,
        )
    except ResponseError as exc:
        traceback.print_exc()
        if "BUSYGROUP" not in str(exc):
            raise
