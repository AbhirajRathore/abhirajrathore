"use client";

import { useState, useCallback } from "react";
import type { ApplicationRecord } from "@/lib/types";
import {
  generateResumePrompt,
  generateScoringPrompt,
  generateImprovementPrompt,
} from "@/lib/promptTemplates";
import styles from "./jobs.module.css";

type PromptType = "resume" | "scoring" | "improvement";

interface Props {
  application: ApplicationRecord;
  onSavePrompt: (type: PromptType, prompt: string) => Promise<void>;
}

const PROMPT_META: Record<PromptType, { label: string; description: string; step: number }> = {
  resume: {
    label: "Resume Prompt",
    step: 1,
    description:
      "Copy this into ChatGPT. Paste the returned JSON in the Resume tab.",
  },
  scoring: {
    label: "Scoring Prompt",
    step: 2,
    description:
      "After pasting resume JSON, copy this to score your resume. Paste the JSON result in the Score tab.",
  },
  improvement: {
    label: "Improvement Prompt",
    step: 3,
    description:
      "After scoring, use this to iteratively improve your resume. Paste the improved JSON back in the Resume tab.",
  },
};

export default function PromptPanel({ application, onSavePrompt }: Props) {
  const [activeType, setActiveType] = useState<PromptType>("resume");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApplied = application.status === "applied";

  const generatePrompt = useCallback(
    (type: PromptType): string | null => {
      try {
        if (type === "resume") return generateResumePrompt(application);
        if (type === "scoring") {
          if (!application.resume_json) return null;
          return generateScoringPrompt(application);
        }
        if (type === "improvement") {
          if (!application.resume_json) return null;
          return generateImprovementPrompt(application);
        }
        return null;
      } catch {
        return null;
      }
    },
    [application]
  );

  const currentPrompt = generatePrompt(activeType);

  async function handleCopyAndSave() {
    if (!currentPrompt) return;
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard may fail in some environments
    }

    if (!isApplied) {
      setSaving(true);
      try {
        await onSavePrompt(activeType, currentPrompt);
      } catch {
        setError("Failed to save prompt");
      } finally {
        setSaving(false);
      }
    }
  }

  function getUnavailableReason(type: PromptType): string | null {
    if (type === "scoring" && !application.resume_json) {
      return "Paste resume JSON first (Resume tab)";
    }
    if (type === "improvement" && !application.resume_json) {
      return "Paste resume JSON first (Resume tab)";
    }
    return null;
  }

  const unavailableReason = getUnavailableReason(activeType);
  const meta = PROMPT_META[activeType];

  return (
    <div>
      {/* Prompt Type Selector */}
      <div className={styles.tabBar} style={{ marginBottom: "1rem" }}>
        {(["resume", "scoring", "improvement"] as PromptType[]).map((type) => {
          const reason = getUnavailableReason(type);
          return (
            <button
              key={type}
              className={`${styles.tab} ${activeType === type ? styles.tabActive : ""}`}
              onClick={() => {
                if (!reason) setActiveType(type);
              }}
              title={reason ?? ""}
              style={{ opacity: reason ? 0.45 : 1, cursor: reason ? "not-allowed" : "pointer" }}
            >
              Step {PROMPT_META[type].step}: {PROMPT_META[type].label}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.85rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
        {meta.description}
      </p>

      {/* Prompt Box */}
      {unavailableReason ? (
        <div
          className={styles.card}
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--secondary)",
            fontSize: "0.875rem",
          }}
        >
          ⚠ {unavailableReason}
        </div>
      ) : currentPrompt ? (
        <>
          <div className={styles.promptBox}>{currentPrompt}</div>
          <div className={styles.promptActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${isApplied || !currentPrompt ? styles.btnDisabled : ""}`}
              onClick={handleCopyAndSave}
              disabled={!currentPrompt || saving}
            >
              {saving ? (
                <>
                  <span className={styles.spinner} /> Saving...
                </>
              ) : (
                "Copy Prompt"
              )}
            </button>
            {copied && (
              <span className={styles.copySuccess}>✓ Copied to clipboard</span>
            )}
            {isApplied && (
              <span style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>
                🔒 Application locked — prompts are read-only
              </span>
            )}
          </div>
          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {error}
            </p>
          )}

          {/* Previously saved indicator */}
          {application.prompts?.[`${activeType}_prompt` as keyof typeof application.prompts] && (
            <p style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.5rem" }}>
              ✓ Prompt saved for this application
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
