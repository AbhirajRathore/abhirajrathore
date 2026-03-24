import { z, ZodSchema } from "zod";

// ─── LaTeX Utilities ──────────────────────────────────────────────────────────

/**
 * Escapes special LaTeX characters to prevent compilation errors.
 * Must be applied to ALL user-supplied strings before injecting into .tex files.
 */
export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/\|/g, "\\textbar{}")
    .replace(/"/g, "\\textquotedbl{}")
    .replace(/'/g, "\\textquotesingle{}")
    .replace(/`/g, "\\textasciigrave{}");
}

/**
 * Replaces <<PLACEHOLDER>> tokens in a LaTeX template string.
 * All values are automatically escaped before insertion.
 */
export function replaceTemplatePlaceholders(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const escaped = escapeLatex(value);
    result = result.replaceAll(`<<${key}>>`, escaped);
  }
  return result;
}

// ─── Resume contact normalization (ChatGPT markdown quirks) ─────────────────

/**
 * Turns `[user@x.com](mailto:user@x.com)` or `mailto:user@x.com` into `user@x.com`.
 * Used before Zod email validation so pasted JSON still validates.
 */
export function normalizeEmailString(input: unknown): unknown {
  if (typeof input !== "string") return input;
  let s = input.trim();
  const md = /^\[([^\]]*)\]\(mailto:([^)]+)\)$/i.exec(s);
  if (md) {
    try {
      return decodeURIComponent(md[2].trim());
    } catch {
      return md[2].trim();
    }
  }
  if (/^mailto:/i.test(s)) return s.replace(/^mailto:/i, "").trim();
  return s;
}

/**
 * Turns `[label](tel:+971...)` or `tel:+971...` into the dialable part.
 */
export function normalizePhoneString(input: unknown): unknown {
  if (typeof input !== "string") return input;
  let s = input.trim();
  const md = /^\[([^\]]*)\]\(tel:([^)]+)\)$/i.exec(s);
  if (md) return md[2].trim();
  if (/^tel:/i.test(s)) return s.replace(/^tel:/i, "").trim();
  return s;
}

/**
 * Turns `[LinkedIn](https://...)` into the raw URL/path (no markdown).
 */
export function normalizeLinkedInString(input: unknown): unknown {
  if (typeof input !== "string") return input;
  let s = input.trim();
  const md = /^\[([^\]]*)\]\(([^)]+)\)$/.exec(s);
  if (md) return md[2].trim();
  return s;
}

// ─── Validation Utilities ─────────────────────────────────────────────────────

export interface ValidationResult<T> {
  success: true;
  data: T;
  errors: null;
}

export interface ValidationError {
  success: false;
  data: null;
  errors: string[];
}

export type ValidationOutcome<T> = ValidationResult<T> | ValidationError;

/**
 * Validates raw input against a Zod schema.
 * Returns typed data on success or a list of human-readable errors on failure.
 */
export function validateJSONWithZod<T>(
  schema: ZodSchema<T>,
  input: unknown
): ValidationOutcome<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });

  return { success: false, data: null, errors };
}

/**
 * Parses a raw string as JSON and validates it against a schema.
 * Returns a detailed error if JSON is malformed.
 */
export function parseAndValidateJSON<T>(
  schema: ZodSchema<T>,
  raw: string
): ValidationOutcome<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      data: null,
      errors: ["Invalid JSON: Could not parse input. Check for syntax errors."],
    };
  }
  return validateJSONWithZod(schema, parsed);
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function now(): string {
  return new Date().toISOString();
}

// ─── Score Utilities ──────────────────────────────────────────────────────────

export function scoreColor(total: number): string {
  if (total >= 80) return "#10b981";
  if (total >= 60) return "#f59e0b";
  return "#ef4444";
}

export function scoreLabel(total: number): string {
  if (total >= 80) return "Strong";
  if (total >= 60) return "Moderate";
  return "Weak";
}
