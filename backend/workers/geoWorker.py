import asyncio
import json
import logging
import os
import uuid

from database.session import SessionLocal
from models.ClickEvent import ClickEvent
from services.geoCache import get_geo_data
from services.redisClient import ensure_stream_group, get_redis

STREAM = "geo-stream"
GROUP = "geo-workers"

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


async def worker():

    redis = get_redis()
    consumer_name = os.getenv("GEO_WORKER_NAME", f"geo-worker-{uuid.uuid4().hex[:8]}")

    await ensure_stream_group(STREAM, GROUP)

    while True:

        messages = await redis.xreadgroup(
            groupname=GROUP,
            consumername=consumer_name,
            streams={STREAM: ">"},
            count=1,
            block=5000,
        )

        if not messages:
            continue

        for _, entries in messages:

            db = SessionLocal()

            try:

                for message_id, fields in entries:

                    event = json.loads(fields["data"])

                    geo = await get_geo_data(
                        event["clientIp"]
                    )

                    status = "DONE" if geo else "FAILED"

                    db.query(ClickEvent).filter(
                        ClickEvent.eventId == event["eventId"]
                    ).update(
                        {
                            "country": geo.get("country"),
                            "region": geo.get("regionName"),
                            "city": geo.get("city"),
                            "timezone": geo.get("timezone"),
                            "isp": geo.get("isp"),
                            "geoStatus": status,
                        }
                    )

                    db.commit()

                    await redis.xack(
                        STREAM,
                        GROUP,
                        message_id,
                    )

            except Exception:
                db.rollback()
                logger.exception("Geo worker failed to process geo event")

            finally:

                db.close()


asyncio.run(worker())
