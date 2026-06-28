import asyncio
import json
import logging
import os
import traceback
import uuid

from database.session import SessionLocal
from models.ClickEvent import ClickEvent
from services.geoCache import get_geo_data
from services.redisClient import ensure_stream_group, get_redis

STREAM = "geo-stream"
GROUP = "geo-workers"

REQUESTS_PER_MINUTE = 40
DELAY_BETWEEN_REQUESTS = 60 / REQUESTS_PER_MINUTE  # 1.5 seconds

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


async def worker():
    redis = get_redis()

    consumer_name = os.getenv(
        "GEO_WORKER_NAME",
        f"geo-worker-{uuid.uuid4().hex[:8]}",
    )

    await ensure_stream_group(STREAM, GROUP)

    while True:

        messages = await redis.xreadgroup(
            groupname=GROUP,
            consumername=consumer_name,
            streams={STREAM: ">"},
            count=20,
            block=5000,
        )

        if not messages:
            continue

        db = SessionLocal()

        try:

            ack_ids = []

            for _, entries in messages:

                for message_id, fields in entries:

                    event = json.loads(fields["data"])

                    # -----------------------------
                    # Rate-limited Geo Lookup
                    # -----------------------------
                    geo = await get_geo_data(event["clientIp"])

                    if geo:
                        db.query(ClickEvent).filter(
                            ClickEvent.eventId == event["eventId"]
                        ).update(
                            {
                                "country": geo.get("country"),
                                "region": geo.get("regionName"),
                                "city": geo.get("city"),
                                "timezone": geo.get("timezone"),
                                "isp": geo.get("isp"),
                                "geoStatus": "DONE",
                            }
                        )
                    else:
                        db.query(ClickEvent).filter(
                            ClickEvent.eventId == event["eventId"]
                        ).update(
                            {
                                "geoStatus": "FAILED",
                            }
                        )

                    ack_ids.append(message_id)

                    # Wait 1.5 seconds before the next ip-api request
                    await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

            db.commit()

            for message_id in ack_ids:
                await redis.xack(
                    STREAM,
                    GROUP,
                    message_id,
                )

        except Exception:
            db.rollback()
            traceback.print_exc()
            logger.exception("Geo worker failed")

        finally:
            db.close()


if __name__ == "__main__":
    asyncio.run(worker())