import time

EPOCH = 1781049600000

DATACENTER_ID = 1
MACHINE_ID = 1

SEQUENCE_BITS = 12
MACHINE_BITS = 5
DATACENTER_BITS = 5

MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1

last_timestamp = -1
sequence = 0


def getUniqueID():
    global last_timestamp, sequence

    timestamp = time.time_ns() // 1_000_000
    timestamp -= EPOCH

    if timestamp == last_timestamp:
        sequence = (sequence + 1) & MAX_SEQUENCE

        if sequence == 0:
            while timestamp <= last_timestamp:
                timestamp = time.time_ns() // 1_000_000
                timestamp -= EPOCH
    else:
        sequence = 0

    last_timestamp = timestamp

    return (
        (timestamp << 22)
        | (DATACENTER_ID << 17)
        | (MACHINE_ID << 12)
        | sequence
    )