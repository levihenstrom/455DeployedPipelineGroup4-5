import { readFileSync } from "node:fs";
import { join } from "node:path";

type CsvStats = {
  rows: number;
  fraudRate: number;
  lateRate: number;
};

export function getCsvStats(): CsvStats | null {
  try {
    const fraudCsv = readFileSync(join(process.cwd(), "..", "data", "processed", "fraud_dataset.csv"), "utf-8");
    const deliveryCsv = readFileSync(join(process.cwd(), "..", "data", "processed", "delivery_dataset.csv"), "utf-8");

    const fraudLines = fraudCsv.trim().split("\n");
    const deliveryLines = deliveryCsv.trim().split("\n");
    const fraudHeader = fraudLines[0].split(",");
    const deliveryHeader = deliveryLines[0].split(",");
    const fraudIdx = fraudHeader.indexOf("is_fraud");
    const lateIdx = deliveryHeader.indexOf("late_delivery");

    let fraudPositives = 0;
    let latePositives = 0;

    for (let i = 1; i < fraudLines.length; i += 1) {
      const cols = fraudLines[i].split(",");
      if (Number(cols[fraudIdx]) === 1) fraudPositives += 1;
    }
    for (let i = 1; i < deliveryLines.length; i += 1) {
      const cols = deliveryLines[i].split(",");
      if (Number(cols[lateIdx]) === 1) latePositives += 1;
    }

    return {
      rows: fraudLines.length - 1,
      fraudRate: fraudPositives / Math.max(1, fraudLines.length - 1),
      lateRate: latePositives / Math.max(1, deliveryLines.length - 1)
    };
  } catch {
    return null;
  }
}
