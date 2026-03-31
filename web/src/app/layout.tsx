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
          <p>SQLite to Cleaning to ML to Supabase to Vercel</p>
          <p>
            <Link href="/">Dashboard</Link> | <Link href="/fraud">Fraud Prediction</Link> |{" "}
            <Link href="/delivery">Delivery Prediction</Link> | <Link href="/insights">Model Insights</Link>
          </p>
          {children}
        </main>
      </body>
    </html>
  );
}
