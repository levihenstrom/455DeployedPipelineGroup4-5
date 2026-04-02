import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Shop ML Dashboard",
  description: "E-commerce analytics and ML pipeline"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const customerId   = cookieStore.get("customer_id")?.value   ?? null;
  const customerName = cookieStore.get("customer_name")?.value ?? null;

  return (
    <html lang="en">
      <body>
        <main>

          {/* ── Hero banner ── */}
          <div className="hero">
            <h1>
              <Link href="/">Shop ML Dashboard</Link>
            </h1>
            <p>End-to-end machine learning pipeline — fraud detection & late delivery prediction</p>
            <div className="hero-pills">
              <span className="hero-pill">Postgres → Supabase</span>
              <span className="hero-pill">scikit-learn</span>
              <span className="hero-pill">Next.js → Vercel</span>
              <span className="hero-pill">CRISP-DM</span>
            </div>
          </div>

          {/* ── Customer banner ── */}
          {customerId && customerName && (
            <div className="customer-banner">
              <span>Acting as: <strong>{decodeURIComponent(customerName)}</strong></span>
              <Link href="/select-customer" style={{ fontSize: 13 }}>Change →</Link>
            </div>
          )}

          {/* ── Navigation (customer: Shop + Fraud ML only) ── */}
          <nav className="nav-wrapper">
            <div className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger">Shop</button>
              <div className="nav-dropdown-menu">
                <Link href="/select-customer">Select customer</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/place-order">Checkout</Link>
                <Link href="/orders">My orders</Link>
              </div>
            </div>

            <div className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger">ML tools</button>
              <div className="nav-dropdown-menu">
                <Link href="/fraud">Fraud prediction</Link>
              </div>
            </div>
          </nav>

          {children}
        </main>
      </body>
    </html>
  );
}