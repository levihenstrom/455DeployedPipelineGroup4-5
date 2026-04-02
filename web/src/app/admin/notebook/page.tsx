import Link from "next/link";

export default function AdminNotebookSummaryPage() {
  return (
    <section>
      <p>
        <Link href="/admin/orders" style={{ fontSize: 14 }}>
          ← Order dashboard
        </Link>
      </p>
      <h2>Notebook summary (shop.ipynb)</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
        High-level map of the course notebook: exploratory work, data prep, and model training—not executed in the
        browser. Open <code>shop.ipynb</code> in the repo for full code and outputs.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Data &amp; schema</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
          <li>Loads operational tables (customers, orders, order items, products, shipments) from SQLite / engine.</li>
          <li>Inspects shapes, dtypes, missing values, and basic distributions.</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Feature engineering</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
          <li>Builds fraud-oriented features (totals, ratios, customer age, item aggregates, shipping context).</li>
          <li>Aligns with the same feature contract used by <code>ml/src/extract_and_clean.py</code> for training CSVs.</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Models</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
          <li>Fraud and delivery tasks trained via scikit-learn pipelines (preprocess + classifier).</li>
          <li>Metrics: accuracy, precision/recall/F1, ROC-AUC / PR-AUC as appropriate.</li>
          <li>Artifacts saved with <code>joblib</code> under <code>ml/models/</code> for API inference.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Deployment story</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
          <li>Operational data in Supabase; Next.js calls Python <code>predict.py</code> for scoring at checkout.</li>
          <li>Admin labels on orders become ground truth for future retraining (scheduled / offline).</li>
        </ul>
      </div>
    </section>
  );
}
