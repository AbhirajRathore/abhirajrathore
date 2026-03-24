"use client";

import { useState, useCallback } from "react";
import type { ApplicationRecord } from "@/lib/types";
import type { ApplicationScore } from "@/lib/types";
import { ScoreSchema } from "@/lib/schemas";
import { generateScoringPrompt } from "@/lib/promptTemplates";
import { parseAndValidateJSON, scoreColor, scoreLabel } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import styles from "./jobs.module.css";

interface Props {
  application: ApplicationRecord;
  onSaveScore: (
    score: ApplicationScore,
    missingKeywords: string[],
    improvements: string[]
  ) => Promise<void>;
  /** Persist scoring_prompt on the application when copying (skipped when applied / locked). */
  onSaveScoringPrompt?: (prompt: string) => Promise<void>;
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = scoreColor(value);
  return (
    <div className={styles.scoreItem}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className={styles.scoreLabel}>{label}</span>
        <span style={{ fontWeight: 700, color, fontSize: "0.9rem" }}>{value}</span>
      </div>
      <div className={styles.scoreBar}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function ScorePanel({
  application,
  onSaveScore,
  onSaveScoringPrompt,
}: Props) {
  const [rawJson, setRawJson] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<"view" | "input">(
    application.score ? "view" : "input"
  );
  const [copied, setCopied] = useState<null | "resume" | "jd" | "prompt">(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [promptSaving, setPromptSaving] = useState(false);

  const isApplied = application.status === "applied";
  const score = application.score;

  const copyToClipboard = useCallback(
    async (text: string, kind: "resume" | "jd" | "prompt") => {
      setClipboardError(null);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 2000);
      } catch {
        setClipboardError("Could not copy to clipboard. Select and copy manually.");
      }
    },
    []
  );

  async function handleCopyScoringPrompt() {
    if (!application.resume_json) return;
    setClipboardError(null);
    let text: string;
    try {
      text = generateScoringPrompt(application);
    } catch {
      setClipboardError("Could not build scoring prompt (missing resume JSON).");
      return;
    }
    setPromptSaving(true);
    try {
      await copyToClipboard(text, "prompt");
      if (!isApplied && onSaveScoringPrompt) {
        try {
          await onSaveScoringPrompt(text);
        } catch {
          setClipboardError("Copied to clipboard, but saving prompt to this record failed.");
        }
      }
    } finally {
      setPromptSaving(false);
    }
  }

  async function handleSave() {
    if (isApplied) return;
    setErrors([]);
    setSuccess(false);

    const result = parseAndValidateJSON(ScoreSchema, rawJson);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    const data = result.data;
    setSaving(true);
    try {
      await onSaveScore(
        {
          keyword_match: data.keyword_match,
          relevance: data.relevance,
          impact: data.impact,
          clarity: data.clarity,
          total: data.total,
        },
        data.missing_keywords,
        data.improvements
      );
      setSuccess(true);
      setTab("view");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors(["Failed to save score. Please try again."]);
    } finally {
      setSaving(false);
    }
  }

  const threshold = APP_CONFIG.SCORE_READY_THRESHOLD;

  return (
    <div>
      {isApplied && (
        <div className={styles.lockBanner}>
          🔒 Application locked — score is immutable.
        </div>
      )}

      {application.resume_json && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "8px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginRight: "0.25rem",
            }}
          >
            For ChatGPT
          </span>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={() =>
              copyToClipboard(
                JSON.stringify(application.resume_json, null, 2),
                "resume"
              )
            }
          >
            Copy resume JSON
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={() =>
              copyToClipboard(application.job_description, "jd")
            }
          >
            Copy job description
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} ${promptSaving ? styles.btnDisabled : ""}`}
            onClick={handleCopyScoringPrompt}
            disabled={promptSaving}
          >
            {promptSaving ? (
              <>
                <span className={styles.spinner} /> Copying...
              </>
            ) : (
              "Copy scoring prompt"
            )}
          </button>
          {copied === "resume" && (
            <span className={styles.copySuccess}>✓ Resume JSON copied</span>
          )}
          {copied === "jd" && (
            <span className={styles.copySuccess}>✓ Job description copied</span>
          )}
          {copied === "prompt" && (
            <span className={styles.copySuccess}>✓ Scoring prompt copied</span>
          )}
          {clipboardError && (
            <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>
              {clipboardError}
            </span>
          )}
        </div>
      )}

      {/* Tab switcher */}
      {score && (
        <div className={styles.tabBar} style={{ marginBottom: "1rem" }}>
          <button
            className={`${styles.tab} ${tab === "view" ? styles.tabActive : ""}`}
            onClick={() => setTab("view")}
          >
            Score Overview
          </button>
          {!isApplied && (
            <button
              className={`${styles.tab} ${tab === "input" ? styles.tabActive : ""}`}
              onClick={() => setTab("input")}
            >
              Update Score
            </button>
          )}
        </div>
      )}

      {/* Score View */}
      {tab === "view" && score ? (
        <>
          {/* Total Score */}
          <div className={styles.scoreTotalBlock}>
            <div>
              <div
                className={styles.scoreTotalNumber}
                style={{ color: scoreColor(score.total) }}
              >
                {score.total}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: 2 }}>
                / 100 Total
              </div>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: scoreColor(score.total),
                  fontSize: "1.1rem",
                }}
              >
                {scoreLabel(score.total)}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--secondary)", marginTop: 2 }}>
                {score.total >= threshold
                  ? `✓ Above threshold (${threshold}) — Ready to apply`
                  : `✕ Below threshold (${threshold}) — Improve before applying`}
              </div>
            </div>
          </div>

          {/* Individual Scores */}
          <div className={styles.scoreGrid}>
            <ScoreBar value={score.keyword_match} label="Keyword Match" />
            <ScoreBar value={score.relevance} label="Relevance" />
            <ScoreBar value={score.impact} label="Impact" />
            <ScoreBar value={score.clarity} label="Clarity" />
          </div>

          {/* Missing Keywords */}
          {application.missing_keywords && application.missing_keywords.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.5rem",
                }}
              >
                Missing Keywords
              </div>
              <div className={styles.tagList}>
                {application.missing_keywords.map((kw) => (
                  <span key={kw} className={`${styles.tag} ${styles.tagWarning}`}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {application.improvements && application.improvements.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.5rem",
                }}
              >
                Improvement Suggestions
              </div>
              {application.improvements.map((imp, i) => (
                <div key={i} className={styles.improvement}>
                  <span className={styles.improvementIcon}>⚡</span>
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Score Input */
        <div>
          {!application.resume_json ? (
            <div
              className={styles.card}
              style={{ textAlign: "center", padding: "2rem", color: "var(--secondary)" }}
            >
              ⚠ You must save a resume JSON first before scoring.
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
                Paste the score JSON output from ChatGPT here. It will be
                validated and saved to this application record.
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
                Auto-promotion: If <strong>total ≥ {threshold}</strong>, status
                will automatically change to <strong>Ready</strong>.
              </p>

              <textarea
                className={styles.jsonTextarea}
                value={rawJson}
                onChange={(e) => {
                  setRawJson(e.target.value);
                  setErrors([]);
                }}
                placeholder={`{\n  "keyword_match": 85,\n  "relevance": 80,\n  "impact": 75,\n  "clarity": 90,\n  "total": 82,\n  "missing_keywords": ["GraphQL", "Docker"],\n  "improvements": ["Quantify impact in bullet 3..."]\n}`}
                spellCheck={false}
              />

              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary} ${saving ? styles.btnDisabled : ""}`}
                  onClick={handleSave}
                  disabled={saving || !rawJson.trim()}
                >
                  {saving ? (
                    <>
                      <span className={styles.spinner} /> Saving...
                    </>
                  ) : (
                    "Validate & Save Score"
                  )}
                </button>
              </div>

              {errors.length > 0 && (
                <div className={styles.validationErrors}>
                  <div className={styles.validationErrorTitle}>
                    ✕ Validation Failed
                  </div>
                  {errors.map((err, i) => (
                    <div key={i} className={styles.validationErrorItem}>
                      • {err}
                    </div>
                  ))}
                </div>
              )}

              {success && (
                <div className={styles.validationSuccess}>
                  ✓ Score saved successfully
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
