"use client";

import { useState } from "react";
import type { ApplicationRecord } from "@/lib/types";
import type { ResumeJSON } from "@/lib/types";
import { ResumeSchema } from "@/lib/schemas";
import { parseAndValidateJSON } from "@/lib/utils";
import styles from "./jobs.module.css";

interface Props {
  application: ApplicationRecord;
  onSaveResume: (resumeJson: ResumeJSON, versionId: string) => Promise<void>;
}

export default function JSONInputPanel({ application, onSaveResume }: Props) {
  const [raw, setRaw] = useState(
    application.resume_json ? JSON.stringify(application.resume_json, null, 2) : ""
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const isApplied = application.status === "applied";

  async function handleSave() {
    if (isApplied) return;
    setErrors([]);
    setSuccess(false);

    const result = parseAndValidateJSON(ResumeSchema, raw);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      const versionId = `v${Date.now()}`;
      await onSaveResume(result.data as ResumeJSON, versionId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors(["Failed to save resume. Please try again."]);
    } finally {
      setSaving(false);
    }
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(raw);
      setRaw(JSON.stringify(parsed, null, 2));
      setErrors([]);
    } catch {
      setErrors(["Cannot format: Invalid JSON syntax"]);
    }
  }

  function handleClear() {
    if (isApplied) return;
    setRaw("");
    setErrors([]);
    setSuccess(false);
  }

  const charCount = raw.length;

  return (
    <div>
      {isApplied && (
        <div className={styles.lockBanner}>
          🔒 This application is locked. Resume JSON is immutable.
        </div>
      )}

      <p style={{ fontSize: "0.85rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
        Paste the JSON output from ChatGPT here. The system validates against the
        resume schema before saving. Ask the model for{" "}
        <strong>plain strings</strong> for contact fields:{" "}
        <code style={{ fontSize: "0.8em" }}>email</code> must be only{" "}
        <code style={{ fontSize: "0.8em" }}>user@domain.com</code> (not{" "}
        <code style={{ fontSize: "0.8em" }}>[text](mailto:...)</code>
        ). Same idea for <code style={{ fontSize: "0.8em" }}>phone</code> and{" "}
        <code style={{ fontSize: "0.8em" }}>linkedin</code> — no Markdown link
        syntax inside JSON values. If ChatGPT still uses links, save will
        auto-normalize common patterns when possible.
      </p>

      <textarea
        className={styles.jsonTextarea}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setErrors([]);
          setSuccess(false);
        }}
        placeholder={`Paste the AI-generated JSON here...\n\nExpected structure:\n{\n  "name": "...",\n  "email": "...",\n  "summary": "...",\n  "skills": [...],\n  "experience": [...],\n  "education": [...]\n}`}
        disabled={isApplied}
        spellCheck={false}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.5rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
          {charCount.toLocaleString()} characters
        </span>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!isApplied && (
            <>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={handleFormat}
                type="button"
              >
                Format JSON
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={handleClear}
                type="button"
              >
                Clear
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} ${saving ? styles.btnDisabled : ""}`}
                onClick={handleSave}
                disabled={saving || !raw.trim()}
                type="button"
              >
                {saving ? (
                  <>
                    <span className={styles.spinner} /> Validating & Saving...
                  </>
                ) : (
                  "Validate & Save Resume"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className={styles.validationErrors}>
          <div className={styles.validationErrorTitle}>
            ✕ Validation Failed ({errors.length} error{errors.length > 1 ? "s" : ""})
          </div>
          {errors.map((err, i) => (
            <div key={i} className={styles.validationErrorItem}>
              • {err}
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className={styles.validationSuccess}>
          ✓ Resume validated and saved successfully
          {application.resume_version_id && (
            <span style={{ fontWeight: 400, marginLeft: 8, fontSize: "0.8rem" }}>
              Version: {application.resume_version_id}
            </span>
          )}
        </div>
      )}

      {/* Current version info */}
      {application.resume_json && application.resume_version_id && (
        <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "0.75rem" }}>
          Current version: <strong>{application.resume_version_id}</strong>
          {" · "}Saved in this application record
        </p>
      )}
    </div>
  );
}
