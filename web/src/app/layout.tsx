import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Class Demo Website + ML",
  description: "Simple ecommerce analytics and ML demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Class Demo Website + ML</h1>
          <p>Postgres to Cleaning to ML to Supabase to Vercel</p>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <Link href="/">Dashboard</Link>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Link href="/customers">Customers</Link>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Link href="/warehouse">Warehouse Queue</Link>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Link href="/fraud">Fraud Prediction</Link>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Link href="/delivery">Delivery Prediction</Link>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Link href="/insights">Model Insights</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
