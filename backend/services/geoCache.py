import asyncio
import json
import logging

from services import geoLocation
from services.redisClient import get_redis

logger = logging.getLogger(__name__)

CACHE_TTL = 60 * 60 * 24 * 30      # 30 Days
LOCK_TTL = 30                      # Lock expires after 30 seconds
RATE_LIMIT_DELAY = 1.5             # 40 Requests / Minute


async def get_geo_data(clientIp: str):

    redis = get_redis()

    cache_key = f"geo:{clientIp}"
    lock_key = f"geo-lock:{clientIp}"

    while True:

        # -----------------------------
        # Step 1: Check Redis Cache
        # -----------------------------
        cached = await redis.get(cache_key)

        if cached:
            return json.loads(cached)

        # -----------------------------
        # Step 2: Try to acquire lock
        # -----------------------------
        lock_acquired = await redis.set(
            lock_key,
            "1",
            nx=True,
            ex=LOCK_TTL,
        )

        if lock_acquired:

            try:

                # Respect ip-api rate limit
                await asyncio.sleep(RATE_LIMIT_DELAY)

                geoData = geoLocation.getGeoData(clientIp)

                await redis.setex(
                    cache_key,
                    CACHE_TTL,
                    json.dumps(geoData),
                )

                return geoData

            except Exception as exc:

                logger.exception("Geo lookup failed for IP %s", clientIp)

                return {}

            finally:

                await redis.delete(lock_key)

        # ---------------------------------
        # Another worker is fetching Geo.
        # Wait a little and retry.
        # ---------------------------------

        await asyncio.sleep(0.2)