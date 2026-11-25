"use client";

import { useEffect, useState } from "react";

interface Order {
  id: number;
  customer_name: string;
  item: string;
  status: string;
  created_at: string;
}

const PIPELINE = ["Nginx", "FastAPI", "Redis", "Worker"];
const WAITING_STATUSES = ["pending", "queued", "processing"];

function StatusBadge({ status }: { status: string }) {
  if (status === "processed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mint-800 bg-mint-950 px-3 py-1 text-xs font-medium text-mint-300">
        <span className="size-1.5 rounded-full bg-mint-300" />
        Processed
      </span>
    );
  }

  if (WAITING_STATUSES.includes(status)) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-saffron-800 bg-saffron-950 px-3 py-1 text-xs font-medium text-saffron-300">
        <span className="size-1.5 rounded-full bg-saffron-300 motion-safe:animate-pulse" />
        Processing
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-ink-400">
      {status}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus-visible:border-mint-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300/30";

export default function HomePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [item, setItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiBase}/orders`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Order[] = await res.json();
      setOrders(data);
      setConnectionError(false);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setConnectionError(true);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !item.trim()) return;
    setLoading(true);
    setSubmitError(false);
    try {
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          item: item.trim(),
        }),
      });
      if (res.ok) {
        setCustomerName("");
        setItem("");
        await fetchOrders();
      } else {
        setSubmitError(true);
      }
    } catch (err) {
      console.error("Failed to submit order:", err);
      setSubmitError(true);
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold leading-tight">
          Smart Order Micro-Stack
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-400">
          Add an order and follow its journey: it reaches the server, waits in the queue, then a background worker processes it.
        </p>
        <ol
          aria-label="Order pipeline"
          className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-ink-400"
        >
          {PIPELINE.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className="rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 font-medium text-ink-100"
              >
                {step}
              </span>
              {i < PIPELINE.length - 1 && (
                <span aria-hidden="true" className="text-ink-500">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-ink-700 bg-ink-900 p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer"
              className="mb-1.5 block text-sm font-medium"
            >
              Customer name
            </label>
            <input
              id="customer"
              type="text"
              autoComplete="off"
              placeholder="e.g. Ahmed"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="item" className="mb-1.5 block text-sm font-medium">
              Order or service
            </label>
            <input
              id="item"
              type="text"
              autoComplete="off"
              placeholder="e.g. Device repair"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-ink-100 px-6 py-2.5 text-sm font-bold text-ink-950 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Add order"}
          </button>
          {submitError && (
            <p role="alert" className="text-sm text-saffron-300">
              Couldn’t send the order. Check the server connection and try again.
            </p>
          )}
        </div>
      </form>

      <section className="mt-8 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            Orders
            <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-400">
              {orders.length}
            </span>
          </h2>
          <span
            className={`flex items-center gap-1.5 text-xs ${
              connectionError ? "text-saffron-300" : "text-ink-400"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                connectionError ? "bg-saffron-300" : "bg-mint-300"
              }`}
            />
            {connectionError ? "Can’t reach the server" : "Live updates"}
          </span>
        </div>

        {sortedOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm leading-7 text-ink-400">
            No orders yet. Add the first one and watch it move from waiting to processed.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700">
            {sortedOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {order.customer_name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink-400">
                    {order.item}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}