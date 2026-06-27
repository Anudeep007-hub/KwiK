import asyncio
import json
import logging
import os
import uuid
from datetime import datetime

from database.session import SessionLocal
from models.ClickEvent import ClickEvent
from services.redisClient import ensure_stream_group, get_redis

STREAM = "click-stream"
GROUP = "db-workers"
GEO_STREAM = "geo-stream"

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


def parse_timestamp(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        logger.warning("Invalid click timestamp received: %s", value)
        return None


async def worker():

    redis = get_redis()
    consumer_name = os.getenv("DB_WORKER_NAME", f"db-worker-{uuid.uuid4().hex[:8]}")

    await ensure_stream_group(STREAM, GROUP)

    while True:

        messages = await redis.xreadgroup(
            groupname=GROUP,
            consumername=consumer_name,
            streams={STREAM: ">"},
            count=100,
            block=5000,
        )

        if not messages:
            continue

        for _, entries in messages:

            db = SessionLocal()

            try:

                batch = []

                ids = []
                geo_events = []

                for message_id, fields in entries:

                    event = json.loads(fields["data"])

                    batch.append(
                        ClickEvent(
                            eventId=event["eventId"],
                            shortCode=event["shortCode"],
                            userId=event["userId"],
                            ipHash=event["ipHash"],
                            userAgent=event["browser"],
                            timestamp=parse_timestamp(event.get("timestamp")),
                            geoStatus="PENDING",
                        )
                    )

                    ids.append(message_id)
                    if event.get("clientIp"):
                        geo_events.append(
                            {
                                "eventId": event["eventId"],
                                "clientIp": event["clientIp"],
                            }
                        )

                db.bulk_save_objects(batch)

                db.commit()

                for event in geo_events:
                    await redis.xadd(
                        GEO_STREAM,
                        {"data": json.dumps(event)},
                    )

                for i in ids:

                    await redis.xack(
                        STREAM,
                        GROUP,
                        i,
                    )

            except Exception:
                db.rollback()
                logger.exception("DB worker failed to process click batch")

            finally:

                db.close()


asyncio.run(worker())
