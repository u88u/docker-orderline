import json
import os
from urllib.parse import quote_plus
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg
import redis
import time

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{quote_plus(os.getenv('POSTGRES_PASSWORD', ''))}"
    f"@db:5432/{os.getenv('POSTGRES_DB')}"
)
REDIS_URL = "redis://redis:6379/0"

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)


def init_db(retries: int = 10, delay: float = 1.0):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS orders (
                            id SERIAL PRIMARY KEY,
                            customer_name VARCHAR(100) NOT NULL,
                            item VARCHAR(150) NOT NULL,
                            status VARCHAR(30) DEFAULT 'pending',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
            return
        except psycopg.OperationalError as exc:
            last_error = exc
            if attempt == retries:
                raise
            time.sleep(delay)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Smart Order Micro-Stack API", lifespan=lifespan)


class OrderCreate(BaseModel):
    customer_name: str
    item: str


@app.get("/health")
def health_check():
    try:
        r.ping()
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/orders", status_code=201)
def create_order(order: OrderCreate):
    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO orders (customer_name, item) VALUES (%s, %s) RETURNING id, status;",
                (order.customer_name, order.item),
            )
            row = cur.fetchone()
            order_id, status = row[0], row[1]

    job = {"order_id": order_id, "customer_name": order.customer_name, "item": order.item}
    r.lpush("orders_queue", json.dumps(job))
    return {"id": order_id, "status": status, "message": "Order queued for processing"}


@app.get("/orders")
def list_orders():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, customer_name, item, status, created_at FROM orders ORDER BY id DESC;")
            rows = cur.fetchall()
            return [
                {
                    "id": row[0],
                    "customer_name": row[1],
                    "item": row[2],
                    "status": row[3],
                    "created_at": str(row[4]),
                }
                for row in rows
            ]