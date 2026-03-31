import { getMetricsSummary } from "@/lib/metrics";

export default function InsightsPage() {
  const metrics = getMetricsSummary();
  if (!metrics) {
    return <div className="card">Run the ML scripts first to generate metrics.</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Fraud Model</h2>
        <p>Best model: {metrics.fraud.best_model}</p>
        <pre>{JSON.stringify(metrics.fraud.models, null, 2)}</pre>
      </div>
      <div className="card">
        <h2>Delivery Model</h2>
        <p>Best model: {metrics.delivery.best_model}</p>
        <pre>{JSON.stringify(metrics.delivery.models, null, 2)}</pre>
      </div>
    </div>
  );
}
