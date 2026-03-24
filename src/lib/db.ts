import Dexie, { type Table } from "dexie";
import type { ApplicationRecord } from "./types";
import { APP_CONFIG } from "./config";

class JobTrackerDB extends Dexie {
  applications!: Table<ApplicationRecord, string>;

  constructor() {
    super(APP_CONFIG.DB_NAME);

    this.version(APP_CONFIG.DB_VERSION).stores({
      // Only indexed fields go here; all other fields are stored automatically
      applications: "id, company, role, status, created_at, applied_at",
    });
  }
}

// Singleton — safe because Dexie lazily opens the connection
let db: JobTrackerDB | null = null;

export function getDB(): JobTrackerDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!db) {
    db = new JobTrackerDB();
  }
  return db;
}
