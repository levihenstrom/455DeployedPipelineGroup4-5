export default function AdminPipelinePage() {
  return (
    <section>
      <h2>ML pipeline</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
        End-to-end flow for fraud detection. Training does not run inside the browser; it uses offline Python
        scripts and scheduled jobs. Admin labels on the order dashboard become the target variable for the next
        retrain.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Flow</h3>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
          <li>
            <strong>Supabase (Postgres)</strong> — operational tables: <code>customers</code>,{" "}
            <code>orders</code>, <code>order_items</code>, <code>shipments</code>.
          </li>
          <li>
            <strong>ETL / features</strong> — <code>ml/src/extract_and_clean.py</code> builds{" "}
            <code>fraud_dataset.csv</code> with the same feature columns the model expects at inference.
          </li>
          <li>
            <strong>Train</strong> — <code>ml/src/train_models.py</code> writes{" "}
            <code>ml/models/fraud_model.joblib</code> and preprocessor artifacts.
          </li>
          <li>
            <strong>Inference</strong> — on each new order, the API calls <code>ml/src/predict.py</code> and
            stores <code>fraud_probability</code> on the order row.
          </li>
          <li>
            <strong>Human labels</strong> — <code>is_fraud</code> is <strong>NULL</strong> until an admin marks an
            order Legit or Fraud; that boolean is ground truth for retraining (model score is only a hint).
          </li>
          <li>
            <strong>Retrain (scheduled)</strong> — typically a nightly job (e.g. GitHub Actions or a VM) exports
            labeled orders, reruns training, and publishes a new model file. This is not executed automatically
            inside the Next.js app on Vercel.
          </li>
        </ol>
      </div>

      <div
        className="card"
        style={{
          background: "#f8fafc",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          overflowX: "auto",
        }}
      >
        <pre style={{ margin: 0 }}>
{`Postgres / Supabase
       │
       ▼
extract_and_clean.py ──► fraud_dataset.csv
       │
       ▼
train_models.py ──► fraud_model.joblib + preprocessor
       │
       ▼
New order ──► predict.py ──► fraud_probability
       │
       ▼
Admin sets is_fraud ──► (nightly) retrain ──► new .joblib`}
        </pre>
      </div>
    </section>
  );
}
