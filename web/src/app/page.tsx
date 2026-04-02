import { getCsvStats } from "@/lib/dbStats";
import { getSupabaseConfigStatus, getSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const csvStats = getCsvStats();
  const config   = getSupabaseConfigStatus();
  const supabase = getSupabaseServerClient();

  let kpi: { total_orders?: number; fraud_rate_pct?: number; late_delivery_rate_pct?: number } | null = null;
  let dbStatus = "Disconnected";
  let dbError: string | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from("vw_kpi_overview").select("*").single();
      if (!error && data) {
        kpi = {
          total_orders:           Number((data as any).total_orders),
          fraud_rate_pct:         Number((data as any).fraud_rate_pct),
          late_delivery_rate_pct: Number((data as any).late_delivery_rate_pct),
        };
        dbStatus = "Connected";
      } else {
        const [{ count }, { data: fraudRows }, { data: lateRows }] = await Promise.all([
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("is_fraud"),
          supabase.from("shipments").select("late_delivery"),
        ]);
        const fraudRate = (fraudRows ?? []).filter((r: any) => r.is_fraud).length / Math.max(1, (fraudRows ?? []).length);
        const lateRate  = (lateRows  ?? []).filter((r: any) => r.late_delivery).length / Math.max(1, (lateRows  ?? []).length);
        kpi = { total_orders: count ?? 0, fraud_rate_pct: fraudRate * 100, late_delivery_rate_pct: lateRate * 100 };
        dbStatus = "Connected";
      }
    } catch (err) {
      dbError = (err as Error).message;
    }
  } else {
    dbError = "Supabase not configured — showing CSV data.";
  }

  const totalOrders  = kpi?.total_orders        ?? csvStats?.rows;
  const fraudRatePct = kpi?.fraud_rate_pct       ?? (csvStats ? csvStats.fraudRate * 100 : null);
  const lateRatePct  = kpi?.late_delivery_rate_pct ?? (csvStats ? csvStats.lateRate * 100 : null);

  return (
    <>
      {/* ── KPI cards ── */}
      <div className="section-header">
        <h2>Overview</h2>
        <div className="section-divider" />
      </div>

      <div className="grid" style={{ marginBottom: 32 }}>
        <div className="card card-blue">
          <div className="label">Total Orders</div>
          <div className="value">{totalOrders?.toLocaleString() ?? "N/A"}</div>
        </div>
        <div className="card card-red">
          <div className="label">Fraud Rate</div>
          <div className="value">{fraudRatePct == null ? "N/A" : `${fraudRatePct.toFixed(1)}%`}</div>
        </div>
        <div className="card card-orange" style={{ borderLeftColor: "#d97706" }}>
          <div className="label">Late Delivery Rate</div>
          <div className="value">{lateRatePct == null ? "N/A" : `${lateRatePct.toFixed(1)}%`}</div>
        </div>
        <div className="card card-green">
          <div className="label">Database</div>
          <div className="value" style={{ fontSize: 16, paddingTop: 4 }}>{dbStatus}</div>
          {dbError && <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{dbError}</p>}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="section-header">
        <h2>Quick Access</h2>
        <div className="section-divider" />
      </div>

      <div className="grid" style={{ marginBottom: 32 }}>
        <Link href="/fraud" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Fraud Detection</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Predict whether an order is fraudulent using Gradient Boosting.
            </div>
          </div>
        </Link>

        <Link href="/delivery" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📦</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Late Delivery</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Predict if a shipment will arrive late using Logistic Regression.
            </div>
          </div>
        </Link>

        <Link href="/insights" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Model Insights</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Explore EDA charts, feature importance, and model performance.
            </div>
          </div>
        </Link>

        <Link href="/warehouse/priority" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🏭</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Warehouse Queue</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Priority queue for orders flagged by the ML scoring pipeline.
            </div>
          </div>
        </Link>
      </div>

      {/* ── Pipeline explanation ── */}
      <div className="section-header">
        <h2>ML Pipeline</h2>
        <div className="section-divider" />
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          {[
            { step: "1", label: "Data", sub: "shop.db → Supabase" },
            { step: "2", label: "EDA", sub: "Explore & visualize" },
            { step: "3", label: "Prep", sub: "Clean & engineer" },
            { step: "4", label: "Train", sub: "4 models per target" },
            { step: "5", label: "Evaluate", sub: "AUC, F1, Recall" },
            { step: "6", label: "Deploy", sub: "Vercel + Supabase" },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "8px 16px" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#1d4ed8", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, margin: "0 auto 6px"
                }}>{item.step}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{item.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: "#cbd5e1", fontSize: 20, padding: "0 4px" }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}