"use client";

import { useState } from "react";
import type { ApplicationRecord } from "@/lib/types";
import { downloadLatexFile } from "@/lib/latexTemplate";
import styles from "./jobs.module.css";

interface Props {
  application: ApplicationRecord;
}

export default function ResumeBuilder({ application }: Props) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const resume = application.resume_json;

  async function handleGeneratePdf() {
    if (!resume) return;
    setGeneratingPdf(true);
    setPdfError(null);
    setPdfSuccess(false);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `PDF generation failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${application.company.replace(/\s+/g, "-")}-${application.role.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleDownloadLatex() {
    if (!resume) return;
    downloadLatexFile(
      resume,
      `resume-${application.company}-${application.role}.tex`
    );
  }

  if (!resume) {
    return (
      <div
        className={styles.card}
        style={{ textAlign: "center", padding: "2.5rem", color: "var(--secondary)" }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📄</div>
        <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>
          No Resume JSON Found
        </div>
        <div style={{ fontSize: "0.85rem" }}>
          Go to the Resume tab and paste your AI-generated resume JSON first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--secondary)", marginBottom: "1rem" }}>
        Generate your resume PDF using the fixed professional template. The
        structure is locked — only your content changes.
      </p>

      {/* Resume Preview Summary */}
      <div
        className={styles.card}
        style={{ marginBottom: "1.25rem", padding: "1rem" }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem" }}>
          {resume.name}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--secondary)", marginBottom: "0.75rem" }}>
          {resume.email} · {resume.phone} · {resume.location}
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            color: "var(--foreground)",
            lineHeight: 1.6,
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--secondary)",
              marginBottom: "0.4rem",
            }}
          >
            Summary preview
          </div>
          {resume.summary.slice(0, 200)}
          {resume.summary.length > 200 ? "..." : ""}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span className={styles.tag}>
            {resume.experience.length} experience{resume.experience.length !== 1 ? "s" : ""}
          </span>
          <span className={styles.tag}>
            {resume.skills.length} skill categor{resume.skills.length !== 1 ? "ies" : "y"}
          </span>
          <span className={styles.tag}>
            {resume.education.length} education entr{resume.education.length !== 1 ? "ies" : "y"}
          </span>
          {resume.projects && resume.projects.length > 0 && (
            <span className={styles.tag}>{resume.projects.length} project{resume.projects.length !== 1 ? "s" : ""}</span>
          )}
          {application.resume_version_id && (
            <span className={styles.tag} style={{ color: "var(--primary)" }}>
              {application.resume_version_id}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${generatingPdf ? styles.btnDisabled : ""}`}
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
        >
          {generatingPdf ? (
            <>
              <span className={styles.spinner} /> Generating PDF...
            </>
          ) : (
            "⬇ Download PDF"
          )}
        </button>

        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={handleDownloadLatex}
        >
          ⬇ Download .tex (LaTeX Source)
        </button>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "0.75rem" }}>
        The .tex file can be compiled at{" "}
        <a
          href="https://overleaf.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--primary)" }}
        >
          overleaf.com
        </a>{" "}
        with the fontawesome5 and geometry packages.
      </p>

      {pdfError && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.65rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#ef4444",
          }}
        >
          ✕ {pdfError}
        </div>
      )}

      {pdfSuccess && (
        <div className={styles.validationSuccess} style={{ marginTop: "0.75rem" }}>
          ✓ PDF downloaded successfully
        </div>
      )}
    </div>
  );
}
