"use client";

import { useEffect, useState } from "react";

export default function PipelineMonitor() {
  const [retrainData, setRetrainData] = useState<any>(null);
  const [monitorData, setMonitorData] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchData = async () => {
    try {
      const [retres, monres] = await Promise.all([
        fetch("/api/pipeline/retrain").then(r => r.json()),
        fetch("/api/pipeline/monitor").then(r => r.json())
      ]);
      setRetrainData(retres);
      setMonitorData(monres);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const runPipeline = async () => {
    setLoadingAction(true);
    try {
      await fetch("/api/pipeline/retrain", { method: "POST" });
      setTimeout(fetchData, 2000);
    } catch(e) {
      console.error(e);
    }
    setLoadingAction(false);
  };

  const renderTask = (task: string, title: string) => {
    if (!retrainData || !monitorData) return null;
    const stats = monitorData[task];
    const metrics = retrainData.metricsSummary?.[task];
    const recentModelName = metrics?.best_model || "Loading...";

    return (
      <div className="card" style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "16px", borderRadius: "8px" }}>
        <h2>{title} ({recentModelName})</h2>
        <p>Rows: {metrics?.rows} | Class Balance: {Number(metrics?.class_balance || 0).toFixed(3)}</p>
        <p>
          Accuracy: {(metrics?.models?.[recentModelName]?.accuracy || 0).toFixed(3)} | 
          Recall: {(metrics?.models?.[recentModelName]?.recall || 0).toFixed(3)} |
          F1: {(metrics?.models?.[recentModelName]?.f1 || 0).toFixed(3)} |
          ROC-AUC: {(metrics?.models?.[recentModelName]?.roc_auc || 0).toFixed(3)}
          {task === "fraud" && ` | PR-AUC: ${(metrics?.models?.[recentModelName]?.pr_auc || 0).toFixed(3)}`}
        </p>
        <div style={{ marginTop: "10px" }}>
          <strong>Drift Status:</strong> {stats.drift.metric} at {stats.drift.value.toFixed(3)} 
          (Threshold: {stats.drift.threshold})
          <div style={{ background: "#eee", width: "100%", height: "10px", marginTop: "4px" }}>
            <div style={{ 
               background: stats.drift.value >= stats.drift.threshold ? "green" : "red", 
               height: "100%", 
               width: `${Math.min(100, (stats.drift.value / stats.drift.threshold) * 100)}%` 
            }} />
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <strong>Accuracy History (last 20):</strong>
          <svg width="100%" height="40" style={{ border: "1px solid #eee", marginTop: "4px" }}>
             {stats.accuracy_history && stats.accuracy_history.map((h: any, i: number) => {
                 const x = (i / 19) * 100;
                 const y = 40 - (h[stats.drift.metric] * 40);
                 return <circle key={i} cx={`${x}%`} cy={y} r="3" fill="blue" />;
             })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>ML Pipeline Monitoring</h1>
      
      {monitorData?.active_trigger && (
         <div style={{ background: "#ffcccc", color: "#cc0000", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
           <strong>ALERT!</strong> Drift detected: {monitorData.active_trigger.metric} = {monitorData.active_trigger.value.toFixed(3)} (Threshold: {monitorData.active_trigger.threshold}) from {monitorData.active_trigger.task} task.
         </div>
      )}

      <button onClick={runPipeline} disabled={loadingAction} style={{ marginBottom: "20px", padding: "10px 16px", cursor: "pointer" }}>
        {loadingAction ? "Running..." : "Run Full Pipeline"}
      </button>

      {renderTask("fraud", "Fraud Model")}
      {renderTask("delivery", "Delivery Model")}
    </div>
  );
}
