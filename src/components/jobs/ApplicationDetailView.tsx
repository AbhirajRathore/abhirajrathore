"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationRecord, ApplicationStatus, ApplicationScore, ResumeJSON } from "@/lib/types";
import { useApplicationsStore } from "@/hooks/useApplicationsStore";
import { APP_CONFIG, STATUS_LABELS } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { buildNotionSyncRequestBody } from "@/lib/notionSyncPayload";

import PromptPanel from "./PromptPanel";
import JSONInputPanel from "./JSONInputPanel";
import ScorePanel from "./ScorePanel";
import ResumeBuilder from "./ResumeBuilder";
import StatusController from "./StatusController";
import styles from "./jobs.module.css";

type TabKey = "prompts" | "resume" | "score" | "pdf";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "prompts", label: "Prompts" },
  { key: "resume", label: "Resume JSON" },
  { key: "score", label: "Score" },
  { key: "pdf", label: "PDF / Export" },
];

interface Props {
  id: string;
}

export default function ApplicationDetailView({ id }: Props) {
  const router = useRouter();
  const store = useApplicationsStore();

  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("prompts");
  const [notionSyncing, setNotionSyncing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Load the application record
  useEffect(() => {
    store.getApplicationById(id).then((app) => {
      if (app) setApplication(app);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync local state after store updates
  const refresh = useCallback(async () => {
    const app = await store.getApplicationById(id);
    if (app) setApplication(app);
  }, [id, store]);

  // ── Status Change ────────────────────────────────────────────────────────

  async function handleStatusChange(status: ApplicationStatus) {
    if (!application) return;
    const updated = await store.setStatus(id, status);
    setApplication(updated);

    // Auto-sync to Notion when applied
    if (status === "applied") {
      handleNotionSync(updated);
    }
  }

  // ── Notion Sync ──────────────────────────────────────────────────────────

  async function handleNotionSync(app?: ApplicationRecord) {
    const record = app ?? application;
    if (!record || record.status !== "applied") return;
    setNotionSyncing(true);
    try {
      const res = await fetch("/api/sync-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildNotionSyncRequestBody(record)),
      });
      const data = await res.json();
      if (res.ok && data.notion_page_id) {
        await store.markNotionSynced(id, data.notion_page_id);
        await refresh();
      }
    } catch {
      // Notion sync failure is non-blocking
    } finally {
      setNotionSyncing(false);
    }
  }

  // ── Save Prompt ──────────────────────────────────────────────────────────

  async function handleSavePrompt(
    type: "resume" | "scoring" | "improvement",
    prompt: string
  ) {
    if (!application) return;
    const keyMap = {
      resume: "resume_prompt",
      scoring: "scoring_prompt",
      improvement: "improvement_prompt",
    } as const;
    const updated = await store.updateApplication(id, {
      prompts: { ...application.prompts, [keyMap[type]]: prompt },
    });
    setApplication(updated);
  }

  // ── Save Resume JSON ─────────────────────────────────────────────────────

  async function handleSaveResume(resumeJson: ResumeJSON, versionId: string) {
    const updated = await store.updateApplication(id, {
      resume_json: resumeJson,
      resume_version_id: versionId,
    });
    setApplication(updated);
  }

  // ── Save Score ───────────────────────────────────────────────────────────

  async function handleSaveScore(
    score: ApplicationScore,
    missingKeywords: string[],
    improvements: string[]
  ) {
    if (!application) return;

    // Auto-promote status based on threshold
    const newStatus: ApplicationStatus =
      application.status === "draft" && score.total >= APP_CONFIG.SCORE_READY_THRESHOLD
        ? "ready"
        : application.status;

    const updated = await store.updateApplication(id, {
      score,
      missing_keywords: missingKeywords,
      improvements,
      status: newStatus,
    });
    setApplication(updated);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    await store.deleteApplication(id);
    router.push("/jobs");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.pageShell} style={{ textAlign: "center", paddingTop: "8rem" }}>
        <span className={styles.spinner} style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className={styles.pageShell}>
        <Link href="/jobs" className={styles.backLink}>← Back to Dashboard</Link>
        <div className={styles.card} style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Application Not Found
          </div>
          <p style={{ color: "var(--secondary)" }}>
            This application record does not exist or was deleted.
          </p>
        </div>
      </div>
    );
  }

  const isLocked = application.status === "applied";
  const scoreTotal = application.score?.total;

  return (
    <div className={styles.pageShell}>
      {/* Back */}
      <Link href="/jobs" className={styles.backLink}>
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className={styles.pageHeader} style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className={styles.pageTitle}>
            {application.company}
            <span style={{ color: "var(--secondary)", fontWeight: 400, fontSize: "1.25rem" }}>
              {" "}/ {application.role}
            </span>
          </h1>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            <span
              className={`${styles.badge} ${
                styles[`badge${application.status.charAt(0).toUpperCase() + application.status.slice(1)}` as keyof typeof styles]
              }`}
            >
              {STATUS_LABELS[application.status]}
            </span>
            {scoreTotal !== undefined && (
              <span style={{ fontSize: "0.85rem", color: "var(--secondary)" }}>
                Score:{" "}
                <strong style={{ color: scoreTotal >= 70 ? "#10b981" : scoreTotal >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {scoreTotal}/100
                </strong>
              </span>
            )}
            {isLocked && (
              <span style={{ fontSize: "0.82rem", color: "#10b981" }}>🔒 Locked</span>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--secondary)", marginTop: "0.4rem" }}>
            Created {formatDate(application.created_at)}
            {application.applied_at && ` · Applied ${formatDate(application.applied_at)}`}
            {application.resume_version_id && ` · Resume ${application.resume_version_id}`}
          </div>
        </div>

        {/* Delete */}
        {!isLocked && (
          <div>
            {deleteConfirm ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#ef4444" }}>Confirm delete?</span>
                <button
                  className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
                <button
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className={styles.detailLayout}>
        {/* Left: Main tabs */}
        <div className={styles.detailMain}>
          <div className={styles.card}>
            {/* Tabs */}
            <div className={styles.tabBar}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.key === "resume" && application.resume_json && " ✓"}
                  {t.key === "score" && application.score && " ✓"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "prompts" && (
              <PromptPanel application={application} onSavePrompt={handleSavePrompt} />
            )}
            {activeTab === "resume" && (
              <JSONInputPanel application={application} onSaveResume={handleSaveResume} />
            )}
            {activeTab === "score" && (
              <ScorePanel
                application={application}
                onSaveScore={handleSaveScore}
                onSaveScoringPrompt={async (prompt) => {
                  await handleSavePrompt("scoring", prompt);
                }}
              />
            )}
            {activeTab === "pdf" && (
              <ResumeBuilder application={application} />
            )}
          </div>

          {/* Job Description */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Job Description</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
                {application.job_description.length.toLocaleString()} chars
              </span>
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--secondary)",
                lineHeight: 1.7,
                maxHeight: 320,
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {application.job_description}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className={styles.detailSidebar}>
          {/* Status Controller */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: "1rem" }}>
              Status & Actions
            </h3>
            <StatusController
              application={application}
              onStatusChange={handleStatusChange}
              onSyncNotion={handleNotionSync}
              notionSyncing={notionSyncing}
            />
          </div>

          {/* Step Guide */}
          <div className={styles.card}>
            <div className={styles.stepGuideTitle}>Workflow Steps</div>
            <div className={styles.stepGuide} style={{ border: "none", padding: 0, background: "none" }}>
              {[
                { label: "Create application", done: true },
                { label: "Copy resume prompt → ChatGPT", done: !!application.prompts.resume_prompt },
                { label: "Paste JSON → Resume tab", done: !!application.resume_json },
                { label: "Copy scoring prompt → ChatGPT", done: !!application.prompts.scoring_prompt },
                { label: "Paste score JSON → Score tab", done: !!application.score },
                { label: "Score ≥ 70 → Status: Ready", done: application.status === "ready" || application.status === "applied" || application.status === "interview" },
                { label: "Download PDF", done: !!application.resume_pdf_url },
                { label: "Apply → Lock record", done: application.status === "applied" },
                { label: "Sync to Notion", done: !!application.notion_synced },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`${styles.step} ${step.done ? styles.stepDone : ""}`}
                >
                  <span className={styles.stepNum}>{step.done ? "✓" : i + 1}</span>
                  <span style={{ color: step.done ? "#10b981" : "var(--secondary)" }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Application Meta */}
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>
              Record Info
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "ID", value: application.id.slice(0, 8) + "..." },
                { label: "Created", value: formatDate(application.created_at) },
                { label: "Updated", value: formatDate(application.updated_at) },
                application.applied_at
                  ? { label: "Applied", value: formatDate(application.applied_at) }
                  : null,
                application.resume_version_id
                  ? { label: "Resume Ver.", value: application.resume_version_id }
                  : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div key={row!.label} className={styles.metaRow}>
                    <span style={{ minWidth: 80 }}>{row!.label}:</span>
                    <span className={styles.metaValue}>{row!.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
