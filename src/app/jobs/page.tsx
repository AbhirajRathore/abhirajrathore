"use client";

import { useEffect, useState, useCallback } from "react";
import { useApplicationsStore } from "@/hooks/useApplicationsStore";
import ApplicationTable from "@/components/jobs/ApplicationTable";
import ApplicationCreator from "@/components/jobs/ApplicationCreator";
import type { CreateApplicationInput } from "@/lib/types";
import {
  buildNotionSyncRequestBody,
  isNotionSyncEligible,
} from "@/lib/notionSyncPayload";
import styles from "@/components/jobs/jobs.module.css";

export default function JobsDashboard() {
  const store = useApplicationsStore();
  const [showCreator, setShowCreator] = useState(false);
  const [notionSelectedIds, setNotionSelectedIds] = useState<string[]>([]);
  const [notionBulkSyncing, setNotionBulkSyncing] = useState(false);
  const [notionBulkMessage, setNotionBulkMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    store.getApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setNotionSelectedIds((prev) =>
      prev.filter((id) => {
        const app = store.applications.find((a) => a.id === id);
        return app ? isNotionSyncEligible(app) : false;
      })
    );
  }, [store.applications]);

  async function handleCreate(input: CreateApplicationInput) {
    await store.createApplication(input);
  }

  const toggleNotionRow = useCallback((id: string) => {
    setNotionSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const bulkSelectFiltered = useCallback((eligibleIds: string[]) => {
    if (eligibleIds.length === 0) return;
    setNotionSelectedIds((prev) => {
      const allSelected = eligibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !eligibleIds.includes(id));
      }
      return [...new Set([...prev, ...eligibleIds])];
    });
  }, []);

  const selectedSyncCount = notionSelectedIds.filter((id) => {
    const app = store.applications.find((a) => a.id === id);
    return app && isNotionSyncEligible(app);
  }).length;

  const pendingNotionCount = store.applications.filter(isNotionSyncEligible)
    .length;

  async function handleBulkNotionSync() {
    const ids = notionSelectedIds.filter((id) => {
      const app = store.applications.find((a) => a.id === id);
      return app && isNotionSyncEligible(app);
    });
    if (ids.length === 0) return;

    setNotionBulkSyncing(true);
    setNotionBulkMessage(null);
    let ok = 0;
    const failures: string[] = [];
    let configAbort: string | null = null;

    for (const id of ids) {
      const app = await store.getApplicationById(id);
      if (!app || !isNotionSyncEligible(app)) continue;

      try {
        const res = await fetch("/api/sync-notion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildNotionSyncRequestBody(app)),
        });
        const data = (await res.json()) as {
          error?: string;
          notion_page_id?: string;
        };

        if (res.status === 503) {
          configAbort =
            data.error ??
            "Notion is not configured (set NOTION_API_KEY and NOTION_DATABASE_ID).";
          break;
        }

        if (!res.ok || !data.notion_page_id) {
          failures.push(
            `${app.company}: ${data.error ?? `HTTP ${res.status}`}`
          );
          continue;
        }

        await store.markNotionSynced(id, data.notion_page_id);
        ok++;
      } catch {
        failures.push(`${app.company}: Network or unknown error`);
      }
    }

    await store.getApplications();

    if (configAbort) {
      setNotionBulkMessage(configAbort);
    } else {
      const parts: string[] = [];
      if (ok > 0) parts.push(`Synced ${ok} to Notion`);
      if (failures.length > 0) {
        parts.push(
          `Failed: ${failures.slice(0, 3).join("; ")}${failures.length > 3 ? "…" : ""}`
        );
      }
      setNotionBulkMessage(parts.length > 0 ? parts.join(". ") : null);
    }

    setNotionSelectedIds([]);
    setNotionBulkSyncing(false);
  }

  return (
    <div className={styles.pageShell}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Job <span className={styles.pageTitleAccent}>Tracker</span>
          </h1>
          <p className={styles.pageSubtitle}>
            AI-powered application tracking — every action tied to a record
          </p>
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowCreator(true)}
        >
          + New Application
        </button>
      </div>

      {/* Error Banner */}
      {store.error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠ {store.error}</span>
          <button
            onClick={store.clearError}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading */}
      {store.loading && store.applications.length === 0 ? (
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--secondary)", padding: "2rem 0" }}
        >
          <span className={styles.spinner} />
          Loading applications...
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.notionSyncToolbar}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSuccess} ${notionBulkSyncing || selectedSyncCount === 0 ? styles.btnDisabled : ""}`}
              disabled={notionBulkSyncing || selectedSyncCount === 0}
              onClick={handleBulkNotionSync}
            >
              {notionBulkSyncing ? (
                <>
                  <span className={styles.spinner} /> Syncing to Notion…
                </>
              ) : selectedSyncCount > 0 ? (
                `Sync ${selectedSyncCount} to Notion`
              ) : (
                "Sync to Notion"
              )}
            </button>
            <span className={styles.notionSyncToolbarHint}>
              Select applied roles with the checkboxes (header selects all in the
              current table view). Already-synced rows are skipped and cannot be
              selected.{" "}
              {pendingNotionCount > 0 ? (
                <strong>{pendingNotionCount} pending</strong>
              ) : (
                <span style={{ color: "var(--secondary)" }}>None pending</span>
              )}
            </span>
            {notionBulkMessage && (
              <span
                style={{
                  fontSize: "0.82rem",
                  color: notionBulkMessage.includes("not configured")
                    ? "#f59e0b"
                    : notionBulkMessage.includes("Failed:")
                    ? "#ef4444"
                    : "#10b981",
                  flex: "1 1 100%",
                }}
              >
                {notionBulkMessage}
                <button
                  type="button"
                  onClick={() => setNotionBulkMessage(null)}
                  style={{
                    marginLeft: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                    textDecoration: "underline",
                    fontSize: "inherit",
                  }}
                >
                  Dismiss
                </button>
              </span>
            )}
          </div>
          <ApplicationTable
            applications={store.applications}
            notionSelectedIds={notionSelectedIds}
            onNotionToggleRow={toggleNotionRow}
            onNotionBulkSelectFiltered={bulkSelectFiltered}
          />
        </div>
      )}

      {/* Workflow Reference */}
      <div className={styles.card} style={{ marginTop: "1.5rem" }}>
        <h3 className={styles.cardTitle} style={{ marginBottom: "1rem" }}>
          Workflow Reference
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {[
            { step: "1", label: "Create Application", desc: "Paste full JD" },
            { step: "2", label: "Generate Resume Prompt", desc: "Copy → ChatGPT" },
            { step: "3", label: "Paste JSON", desc: "Validate in Resume tab" },
            { step: "4", label: "Score Resume", desc: "Copy scoring prompt" },
            { step: "5", label: "Iterate", desc: "Use improvement prompt" },
            { step: "6", label: "Download PDF", desc: "Fixed LaTeX template" },
            { step: "7", label: "Mark Applied", desc: "Locks the record" },
            { step: "8", label: "Sync to Notion", desc: "Auto on apply or bulk on dashboard" },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: "0.75rem",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {item.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--secondary)",
                  margin: 0,
                  paddingLeft: "1.7rem",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Modal */}
      {showCreator && (
        <ApplicationCreator
          onCreated={handleCreate}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  );
}
