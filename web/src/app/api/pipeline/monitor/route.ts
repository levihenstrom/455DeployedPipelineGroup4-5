import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const monitoringDir = join(process.cwd(), "..", "ml", "monitoring");

  const getStats = (task: string) => {
    let predictions = { count: 0, positive_rate: 0, avg_probability: 0, high_confidence_pct: 0, since: "", until: "" };
    let accuracy_history: any[] = [];
    
    const predPath = join(monitoringDir, "predictions.jsonl");
    if (existsSync(predPath)) {
      const content = readFileSync(predPath, "utf-8").trim();
      if (content) {
          const taskLines = content.split("\n").map(l => { 
            try { return JSON.parse(l); } catch { return null; } 
          }).filter((p: any) => p && p.task === task);
          
          if (taskLines.length > 0) {
            predictions.count = taskLines.length;
            predictions.since = taskLines[0].timestamp;
            predictions.until = taskLines[taskLines.length - 1].timestamp;
            let positives = 0;
            let sumProb = 0;
            let highConf = 0;
            taskLines.forEach((p: any) => {
              positives += p.prediction;
              sumProb += p.probability;
              if (p.probability > 0.8 || p.probability < 0.2) highConf++;
            });
            predictions.positive_rate = positives / predictions.count;
            predictions.avg_probability = sumProb / predictions.count;
            predictions.high_confidence_pct = highConf / predictions.count;
          }
      }
    }

    const accPath = join(monitoringDir, "accuracy_log.jsonl");
    if (existsSync(accPath)) {
      const content = readFileSync(accPath, "utf-8").trim();
      if (content) {
          const taskLines = content.split("\n").map(l => { 
            try { return JSON.parse(l); } catch { return null; } 
          }).filter((p: any) => p && p.task === task);
          accuracy_history = taskLines.slice(-20);
      }
    }
    
    let drift = { metric: task === "fraud" ? "recall" : "accuracy", threshold: task === "fraud" ? 0.70 : 0.80, value: 0 };
    if (accuracy_history.length > 0) {
        const metricName = drift.metric;
        drift.value = accuracy_history.reduce((sum, h: any) => sum + (h[metricName] || 0), 0) / accuracy_history.length;
    }

    return { predictions, drift, accuracy_history };
  };

  let active_trigger = null;
  const triggerPath = join(monitoringDir, "retrain_trigger.json");
  if (existsSync(triggerPath)) {
    try { active_trigger = JSON.parse(readFileSync(triggerPath, "utf-8")); } catch(e) {}
  }

  return NextResponse.json({
    fraud: getStats("fraud"),
    delivery: getStats("delivery"),
    active_trigger
  });
}
