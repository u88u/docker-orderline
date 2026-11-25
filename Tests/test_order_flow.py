import time
import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost"

def request_json(method: str, path: str, payload: dict | None = None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else None

def main():
    status, health = request_json("GET", "/api/health")
    assert status == 200 and health.get("status") == "healthy", f"Unexpected health: {health}"

    status, created = request_json(
        "POST",
        "/api/orders",
        {"customer_name": "Integration User", "item": "Smart Monitor"},
    )
    assert status in (200, 201), f"Create order failed: {status} {created}"

    time.sleep(2)

    status, orders = request_json("GET", "/api/orders")
    assert status == 200, f"List orders failed: {status} {orders}"
    assert any(o.get("customer_name") == "Integration User" for o in orders), "Created order not found"

    print("Integration test passed successfully.")

if __name__ == "__main__":
    main()