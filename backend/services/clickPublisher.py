import json

from services.redisClient import get_redis


async def publish_geo_event(event_id, client_ip):

    redis = get_redis()

    await redis.xadd(
        "geo-stream",
        {
            "data": json.dumps(
                {
                    "eventId": event_id,
                    "clientIp": client_ip,
                }
            )
        },
    )