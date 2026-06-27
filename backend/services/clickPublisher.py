import asyncio
import json
import logging
import traceback

from services.redisClient import REDIS_TIMEOUT, disconnect_redis, get_redis

logger = logging.getLogger(__name__)


async def publish_click_event(owner_id, shortCode, clickData):
    redis = get_redis()

    event = {
        "eventId": clickData["eventId"],
        "shortCode": shortCode,
        "userId": owner_id,
        "ipHash": clickData["ipHash"],
        "browser": clickData["browser"],
        "clientIp": clickData["clientIp"],
        "timestamp": clickData["timestamp"],
    }

    try:
        message_id = await redis.xadd(
            "click-stream",
            {"data": json.dumps(event)},
        )

        logger.info("Published click event %s", message_id)

        return True

    except Exception:
        traceback.print_exc()
        logger.exception("Failed to publish click event")
        return False


async def publish_geo_event(event_id, client_ip):
    """Compatibility helper for publishing a geo-enrichment job."""

    try:
        redis = get_redis()

        await asyncio.wait_for(
            redis.xadd(
                "geo-stream",
                {
                    "data": json.dumps(
                        {
                            "eventId": event_id,
                            "clientIp": client_ip,
                        }
                    )
                },
            ),
            timeout=REDIS_TIMEOUT,
        )
        return True
    except Exception as exc:
        traceback.print_exc()
        logger.warning("Unable to publish geo event for %s: %s", event_id, exc)
        await disconnect_redis()
        return False
