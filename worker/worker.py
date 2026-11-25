import json
import os
from urllib.parse import quote_plus
import time
import psycopg
import redis

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{quote_plus(os.getenv('POSTGRES_PASSWORD', ''))}"
    f"@db:5432/{os.getenv('POSTGRES_DB')}"
)
REDIS_URL = "redis://redis:6379/0"

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)


def process_orders():
    print("Worker started. Waiting for orders in queue...", flush=True)
    while True:
        _, raw_job = r.brpop("orders_queue")
        job = json.loads(raw_job)
        order_id = job["order_id"]
        print(f"Processing order #{order_id} for {job['customer_name']}...", flush=True)

        # Simulate background processing (e.g., notification or invoice generation)
        time.sleep(2)

        with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE orders SET status = 'processed' WHERE id = %s;",
                    (order_id,),
                )
        print(f"Order #{order_id} marked as processed.", flush=True)


if __name__ == "__main__":
    process_orders()