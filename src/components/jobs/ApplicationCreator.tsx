"use client";

import { useState } from "react";
import type { CreateApplicationInput } from "@/lib/types";
import styles from "./jobs.module.css";

interface Props {
  onCreated: (input: CreateApplicationInput) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  company: string;
  role: string;
  job_description: string;
}

interface FormErrors {
  company?: string;
  role?: string;
  job_description?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.company.trim()) errors.company = "Company name is required";
  if (!form.role.trim()) errors.role = "Role is required";
  if (form.job_description.trim().length < 50)
    errors.job_description = "Job description must be at least 50 characters";
  return errors;
}

export default function ApplicationCreator({ onCreated, onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    company: "",
    role: "",
    job_description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onCreated(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Application</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="company">
              Company *
            </label>
            <input
              id="company"
              name="company"
              className={styles.formInput}
              placeholder="e.g. Google"
              value={form.company}
              onChange={handleChange}
              autoFocus
            />
            {errors.company && (
              <span className={styles.formError}>{errors.company}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="role">
              Role / Position *
            </label>
            <input
              id="role"
              name="role"
              className={styles.formInput}
              placeholder="e.g. Senior Software Engineer"
              value={form.role}
              onChange={handleChange}
            />
            {errors.role && (
              <span className={styles.formError}>{errors.role}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="job_description">
              Job Description *
            </label>
            <textarea
              id="job_description"
              name="job_description"
              className={styles.formTextarea}
              placeholder="Paste the full job description here..."
              value={form.job_description}
              onChange={handleChange}
              rows={8}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>
              {form.job_description.trim().length} characters
            </span>
            {errors.job_description && (
              <span className={styles.formError}>{errors.job_description}</span>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary} ${submitting ? styles.btnDisabled : ""}`}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Creating...
                </>
              ) : (
                "Create Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
