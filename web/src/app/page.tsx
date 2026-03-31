import { getCsvStats } from "@/lib/dbStats";
import { getSupabaseConfigStatus, getSupabaseServerClient } from "@/lib/supabase";

export default async function HomePage() {
  // Prefer Supabase KPI view; fall back to locally processed CSV stats.
  const csvStats = getCsvStats();
  const config = getSupabaseConfigStatus();
  const supabase = getSupabaseServerClient();

  let kpi: { total_orders?: number; fraud_rate_pct?: number; late_delivery_rate_pct?: number } | null = null;
  let dbStatus = "Disconnected";
  let dbError: string | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from("vw_kpi_overview").select("*").single();
      if (error) {
        dbError = `vw_kpi_overview query failed: ${error.message}`;
      } else if (data) {
        kpi = {
          total_orders: Number((data as any).total_orders),
          fraud_rate_pct: Number((data as any).fraud_rate_pct),
          late_delivery_rate_pct: Number((data as any).late_delivery_rate_pct)
        };
        dbStatus = "Connected (view)";
      }

      if (!kpi) {
        const [{ count: orderCount, error: ordersErr }, { data: fraudRows, error: fraudErr }, { data: lateRows, error: lateErr }] =
          await Promise.all([
            supabase.from("orders").select("*", { count: "exact", head: true }),
            supabase.from("orders").select("is_fraud"),
            supabase.from("shipments").select("late_delivery")
          ]);

        if (ordersErr || fraudErr || lateErr) {
          const messages = [ordersErr?.message, fraudErr?.message, lateErr?.message].filter(Boolean);
          dbError = messages.join(" | ");
        } else {
          const fraudRate = (fraudRows ?? []).filter((r: any) => Boolean(r.is_fraud)).length / Math.max(1, (fraudRows ?? []).length);
          const lateRate = (lateRows ?? []).filter((r: any) => Boolean(r.late_delivery)).length / Math.max(1, (lateRows ?? []).length);
          kpi = {
            total_orders: orderCount ?? (fraudRows ?? []).length,
            fraud_rate_pct: fraudRate * 100,
            late_delivery_rate_pct: lateRate * 100
          };
          dbStatus = "Connected (tables)";
          dbError = null;
        }
      }
    } catch (err) {
      dbError = (err as Error).message;
    }
  } else {
    dbError = "Supabase env vars are missing.";
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
          {dbStatus}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          env url: {config.hasUrl ? "yes" : "no"} | anon: {config.hasAnonKey ? "yes" : "no"} | service:{" "}
          {config.hasServiceRoleKey ? "yes" : "no"}
        </div>
        {dbError && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#ffb4b4" }}>
            {dbError}
          </div>
        )}
      </div>
    </section>
  );
}
