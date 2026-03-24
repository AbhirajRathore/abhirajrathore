export const APP_CONFIG = {
  /** Minimum total score to auto-promote status to "ready" */
  SCORE_READY_THRESHOLD: 70,

  /** Database name for Dexie/IndexedDB */
  DB_NAME: "job-tracker-db",

  /** Current DB schema version */
  DB_VERSION: 1,

  /** Default status for new applications */
  DEFAULT_STATUS: "draft" as const,
} as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "#888888",
  ready: "#0070f3",
  applied: "#10b981",
  interview: "#8b5cf6",
  rejected: "#ef4444",
};
