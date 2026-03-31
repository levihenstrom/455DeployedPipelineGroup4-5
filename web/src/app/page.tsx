import { getCsvStats } from "@/lib/dbStats";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  // Prefer Supabase KPI view; fall back to locally processed CSV stats.
  const csvStats = getCsvStats();

  let kpi: { total_orders?: number; fraud_rate_pct?: number; late_delivery_rate_pct?: number } | null = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.from("vw_kpi_overview").select("*").single();
      if (!error && data) {
        kpi = {
          total_orders: Number((data as any).total_orders),
          fraud_rate_pct: Number((data as any).fraud_rate_pct),
          late_delivery_rate_pct: Number((data as any).late_delivery_rate_pct)
        };
      }
    } catch {
      // Keep fallback.
    }
  }

  const totalOrders = kpi?.total_orders ?? csvStats?.rows;
  const fraudRatePct = kpi?.fraud_rate_pct ?? (csvStats ? csvStats.fraudRate * 100 : null);
  const lateRatePct = kpi?.late_delivery_rate_pct ?? (csvStats ? csvStats.lateRate * 100 : null);

  return (
    <section className="grid">
      <div className="card">
        <div className="label">Total Orders</div>
        <div className="value">{totalOrders ?? "N/A"}</div>
      </div>
      <div className="card">
        <div className="label">Fraud Rate</div>
        <div className="value">{fraudRatePct == null ? "N/A" : `${fraudRatePct.toFixed(2)}%`}</div>
      </div>
      <div className="card">
        <div className="label">Late Delivery Rate</div>
        <div className="value">{lateRatePct == null ? "N/A" : `${lateRatePct.toFixed(2)}%`}</div>
      </div>
      <div className="card">
        <div className="label">Status</div>
        <div className="value" style={{ fontSize: 16 }}>
          Demo-ready baseline app
        </div>
      </div>
    </section>
  );
}
