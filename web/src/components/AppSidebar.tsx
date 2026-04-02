"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Mode = "customer" | "admin";

export function AppSidebar({
  mode: initialMode,
  customerId,
  customerName,
}: {
  mode: Mode;
  customerId: string | null;
  customerName: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pending, startTransition] = useTransition();

  async function setAppMode(next: Mode) {
    setMode(next);
    await fetch("/api/app-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    });
    startTransition(() => {
      router.refresh();
      if (next === "admin") {
        router.push("/admin/orders");
      } else {
        router.push("/");
      }
    });
  }

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <Link href="/" className="app-sidebar-title">
          Shop ML
        </Link>
        <p className="app-sidebar-sub">Fraud &amp; delivery ML</p>
      </div>

      <div className="app-mode-toggle" role="group" aria-label="App mode">
        <button
          type="button"
          className={mode === "customer" ? "active" : ""}
          disabled={pending}
          onClick={() => setAppMode("customer")}
        >
          Customer
        </button>
        <button
          type="button"
          className={mode === "admin" ? "active" : ""}
          disabled={pending}
          onClick={() => setAppMode("admin")}
        >
          Admin
        </button>
      </div>

      {mode === "customer" && customerId && customerName && (
        <div className="app-sidebar-banner">
          <span>Acting as</span>
          <strong>{decodeURIComponent(customerName)}</strong>
          <Link href="/select-customer" className="app-sidebar-link">
            Change
          </Link>
        </div>
      )}

      <nav className="app-sidebar-nav" aria-label="Main">
        {mode === "customer" ? (
          <>
            <div className="app-nav-section">Shop</div>
            <Link href="/select-customer">Select customer</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/place-order">Checkout</Link>
            <Link href="/orders">My orders</Link>
            <div className="app-nav-section">ML tools</div>
            <Link href="/fraud">Fraud prediction</Link>
            <Link href="/delivery">Delivery prediction</Link>
            <Link href="/insights">Model insights</Link>
            <div className="app-nav-section">Warehouse</div>
            <Link href="/warehouse/priority">Priority queue</Link>
            <Link href="/scoring">Run scoring</Link>
          </>
        ) : (
          <>
            <div className="app-nav-section">Operations</div>
            <Link href="/admin/orders">Order dashboard</Link>
            <Link href="/admin/pipeline">ML pipeline</Link>
            <div className="app-nav-section">Warehouse</div>
            <Link href="/warehouse/priority">Priority queue</Link>
            <Link href="/scoring">Run scoring</Link>
            <div className="app-nav-section">ML tools</div>
            <Link href="/fraud">Fraud prediction</Link>
            <Link href="/delivery">Delivery prediction</Link>
            <Link href="/insights">Model insights</Link>
          </>
        )}
      </nav>
    </aside>
  );
}
