"use client";

import { useState } from "react";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/config";
import styles from "./jobs.module.css";

interface Props {
  application: ApplicationRecord;
  onStatusChange: (status: ApplicationStatus) => Promise<void>;
  onSyncNotion: () => Promise<void>;
  notionSyncing?: boolean;
}

const STATUS_FLOW: ApplicationStatus[] = [
  "draft",
  "ready",
  "applied",
  "interview",
  "rejected",
];

// Valid transitions from each status
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ["ready", "rejected"],
  ready: ["applied", "draft", "rejected"],
  applied: ["interview", "rejected"],
  interview: ["rejected"],
  rejected: [],
};

// Conditions that must be met before transitioning
function getTransitionGuard(
  app: ApplicationRecord,
  to: ApplicationStatus
): string | null {
  if (to === "ready" && !app.resume_json) {
    return "Paste resume JSON before marking as Ready";
  }
  if (to === "ready" && !app.score) {
    return "Score the resume before marking as Ready";
  }
  if (to === "applied" && !app.resume_json) {
    return "Resume JSON required before applying";
  }
  if (to === "applied" && !app.score) {
    return "Score required before applying";
  }
  return null;
}

function confirmMessage(to: ApplicationStatus): string {
  if (to === "applied") {
    return "Mark as Applied? This will LOCK the resume JSON, score, and prompts permanently.";
  }
  if (to === "rejected") return "Mark this application as Rejected?";
  return "";
}

export default function StatusController({
  application,
  onStatusChange,
  onSyncNotion,
  notionSyncing,
}: Props) {
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = application.status;
  const validNext = VALID_TRANSITIONS[currentStatus] ?? [];
  const isApplied = currentStatus === "applied";

  async function handleTransition(to: ApplicationStatus) {
    const guard = getTransitionGuard(application, to);
    if (guard) {
      setError(guard);
      return;
    }

    const msg = confirmMessage(to);
    if (msg && !window.confirm(msg)) return;

    setError(null);
    setTransitioning(true);
    try {
      await onStatusChange(to);
    } catch {
      setError("Status update failed. Please try again.");
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Status Flow Visualizer */}
      <div className={styles.statusFlow}>
        {STATUS_FLOW.filter((s) => s !== "rejected").map((s, idx) => {
          const linearFlow = STATUS_FLOW.filter((x) => x !== "rejected");
          const statusIndex = linearFlow.includes(currentStatus as typeof linearFlow[number])
            ? linearFlow.indexOf(currentStatus as typeof linearFlow[number])
            : -1;
          const isDone = idx < statusIndex;
          const isActive = s === currentStatus;

          return (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div
                className={`${styles.statusStep} ${isActive ? styles.statusStepActive : ""} ${isDone ? styles.statusStepDone : ""}`}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: isDone
                      ? "#10b981"
                      : isActive
                      ? STATUS_COLORS[s]
                      : "var(--glass-border)",
                    color: isDone || isActive ? "#fff" : "var(--secondary)",
                    flexShrink: 0,
                  }}
                >
                  {isDone ? "✓" : idx + 1}
                </span>
                {STATUS_LABELS[s]}
              </div>
              {idx < STATUS_FLOW.filter((x) => x !== "rejected").length - 1 && (
                <span className={styles.statusArrow} style={{ margin: "0 0.5rem" }}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Applied lock banner */}
      {isApplied && (
        <div className={styles.lockBanner}>
          🔒 Application locked — resume, score, and prompts are immutable.
          Applied: {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "Unknown"}
        </div>
      )}

      {/* Transition buttons */}
      {validNext.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {validNext.map((next) => {
            const guard = getTransitionGuard(application, next);
            const isPositive = !["rejected"].includes(next);
            return (
              <button
                key={next}
                className={`${styles.btn} ${isPositive ? styles.btnPrimary : styles.btnDanger} ${
                  transitioning || !!guard ? styles.btnDisabled : ""
                }`}
                onClick={() => handleTransition(next)}
                disabled={transitioning}
                title={guard ?? ""}
              >
                {transitioning ? (
                  <span className={styles.spinner} />
                ) : (
                  `→ Mark as ${STATUS_LABELS[next]}`
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p style={{ fontSize: "0.82rem", color: "#ef4444", margin: 0 }}>
          ⚠ {error}
        </p>
      )}

      {/* Notion Sync */}
      <div>
        <button
          className={`${styles.notionBtn} ${application.notion_synced ? styles.notionSynced : ""}`}
          onClick={onSyncNotion}
          disabled={notionSyncing || currentStatus !== "applied"}
          title={
            currentStatus !== "applied"
              ? "Notion sync is only available after marking as Applied"
              : ""
          }
          style={{
            opacity: currentStatus !== "applied" ? 0.45 : 1,
            cursor: currentStatus !== "applied" ? "not-allowed" : "pointer",
          }}
        >
          {notionSyncing ? (
            <>
              <span className={styles.spinner} /> Syncing to Notion...
            </>
          ) : application.notion_synced ? (
            "✓ Synced to Notion"
          ) : (
            "Sync to Notion"
          )}
        </button>
        {currentStatus !== "applied" && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginTop: "0.4rem",
            }}
          >
            Notion sync is available after marking the application as Applied.
          </p>
        )}
        {application.notion_page_id && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#10b981",
              marginTop: "0.4rem",
            }}
          >
            Page ID: {application.notion_page_id}
          </p>
        )}
      </div>
    </div>
  );
}
