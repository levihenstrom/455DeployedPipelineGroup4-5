import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Class Demo Website + ML",
  description: "Simple ecommerce analytics and ML demo"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value ?? null;
  const customerName = cookieStore.get("customer_name")?.value ?? null;

  return (
    <html lang="en">
      <body>
        <main>
          <div className="site-header">
            <h1>Class Demo Website + ML</h1>
            <p className="subtitle">Postgres &rarr; Cleaning &rarr; ML &rarr; Supabase &rarr; Vercel</p>
          </div>

          {customerId && customerName && (
            <div className="customer-banner">
              <span>Acting as: <strong>{decodeURIComponent(customerName)}</strong></span>
              <Link href="/select-customer" style={{ fontSize: 13 }}>Change Customer</Link>
            </div>
          )}

          <nav className="nav-bar">
            <Link href="/select-customer" className="nav-btn">Select Customer</Link>

            <div className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger">Customer</button>
              <div className="nav-dropdown-menu">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/place-order">Place Order</Link>
                <Link href="/orders">Order History</Link>
              </div>
            </div>

            <div className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger">Warehouse</button>
              <div className="nav-dropdown-menu">
                <Link href="/warehouse/priority">Priority Queue</Link>
                <Link href="/scoring">Run Scoring</Link>
              </div>
            </div>

            <div className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger secondary">ML Tools</button>
              <div className="nav-dropdown-menu">
                <Link href="/fraud">Fraud Prediction</Link>
                <Link href="/delivery">Delivery Prediction</Link>
                <Link href="/insights">Model Insights</Link>
              </div>
            </div>

            <Link href="/" className="nav-btn secondary">Home</Link>
          </nav>

          {children}
        </main>
      </body>
    </html>
  );
}
