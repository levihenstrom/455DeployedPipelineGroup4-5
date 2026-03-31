import { join } from "node:path";

let dbSingleton: any | null = null;

function resolveDbPath() {
  if (process.env.SHOP_DB_PATH) return process.env.SHOP_DB_PATH;
  return join(process.cwd(), "..", "shop.db");
}

export function getSqliteDb() {
  if (dbSingleton) return dbSingleton;
  // Dynamic require so better-sqlite3 (native addon) is never loaded on Vercel
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  dbSingleton = new Database(resolveDbPath(), { readonly: false });
  dbSingleton.pragma("journal_mode = WAL");
  dbSingleton.pragma("foreign_keys = ON");
  return dbSingleton;
}

