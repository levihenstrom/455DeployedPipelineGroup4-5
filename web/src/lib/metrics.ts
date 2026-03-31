import { readFileSync } from "node:fs";
import { join } from "node:path";

export type MetricsSummary = {
  fraud: {
    class_balance: number;
    best_model: string;
    models: Record<string, Record<string, number>>;
  };
  delivery: {
    class_balance: number;
    best_model: string;
    models: Record<string, Record<string, number>>;
  };
};

export function getMetricsSummary(): MetricsSummary | null {
  try {
    const path = join(process.cwd(), "..", "ml", "reports", "metrics_summary.json");
    return JSON.parse(readFileSync(path, "utf-8")) as MetricsSummary;
  } catch {
    return null;
  }
}
