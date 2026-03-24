import type { ApplicationRecord } from "./types";
import { MASTER_RESUME } from "./masterResume";

// ─── Resume Prompt ────────────────────────────────────────────────────────────

/**
 * Generates a strict prompt that instructs the AI to tailor the master resume
 * to a specific job description. The AI MUST return valid JSON matching ResumeSchema.
 */
export function generateResumePrompt(application: ApplicationRecord): string {
  return `
You are an expert ATS-optimized resume writer. Your task is to tailor the provided master resume to the target job description below.

STRICT RULES:
1. You MUST output ONLY a single valid JSON object. No markdown, no explanation, no preamble.
2. Do NOT hallucinate skills, companies, or achievements. Use ONLY what is in the master resume.
3. Reorder, rephrase, and emphasize existing content to maximize relevance.
4. Use strong action verbs and quantified impact wherever possible.
5. Tailor the summary to directly address the role requirements.
6. Select the most relevant skills and reorder bullet points by relevance.
7. Output MUST be parseable JSON that exactly matches the schema below.
8. CONTACT FIELDS MUST BE PLAIN TEXT INSIDE JSON STRINGS — NO MARKDOWN, NO LINK SYNTAX:
   - "email": ONLY the raw address, e.g. "abhiraj.rathoree@gmail.com"
     FORBIDDEN: "[email](mailto:...)", "mailto:...", angle brackets, or any Markdown around the email.
   - "phone": ONLY the number / E.164 text, e.g. "+971521750314"
     FORBIDDEN: "[phone](tel:...)" or "tel:..." prefix inside the string.
   - "linkedin": ONLY the URL or path, e.g. "linkedin.com/in/username" or "https://www.linkedin.com/in/username"
     FORBIDDEN: "[LinkedIn](https://...)" markdown — output the URL/path alone, not a labeled link.
9. Do not use Markdown anywhere inside JSON string values (no **bold**, no [], no () wrapping links).

OUTPUT SCHEMA (strict - no extra fields):
{
  "name": "string",
  "email": "string (raw email only, e.g. user@domain.com)",
  "phone": "string (raw phone only)",
  "location": "string",
  "linkedin": "string (raw URL or path only)",
  "summary": "string (50-400 chars, role-specific)",
  "skills": [
    { "category": "string", "skills": ["string"] }
  ],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string (e.g. 'Dec 2023')",
      "end_date": "string (e.g. 'Present')",
      "bullets": ["string (action verb + quantified impact)"]
    }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "string" }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "bullets": ["string"]
    }
  ]
}

═══════════════════════════════════════════
TARGET COMPANY: ${application.company}
TARGET ROLE: ${application.role}
═══════════════════════════════════════════

JOB DESCRIPTION:
${application.job_description}

═══════════════════════════════════════════

MASTER RESUME (source of truth — do NOT invent anything outside this):
${MASTER_RESUME}

═══════════════════════════════════════════

Now output ONLY the JSON object. Begin immediately with { and end with }.
`.trim();
}

// ─── Scoring Prompt ───────────────────────────────────────────────────────────

/**
 * Generates a prompt to score the tailored resume against the job description.
 * Requires resume_json to be present on the application.
 */
export function generateScoringPrompt(application: ApplicationRecord): string {
  if (!application.resume_json) {
    throw new Error("Cannot generate scoring prompt: no resume_json present");
  }

  return `
You are an ATS (Applicant Tracking System) expert and senior technical recruiter. Evaluate the tailored resume below against the job description and provide a structured JSON score.

STRICT RULES:
1. Output ONLY a single valid JSON object. No markdown, no explanation, no preamble.
2. Be objective and precise. Do not inflate scores.
3. Each dimension is scored 0–100.
4. total = weighted average: keyword_match×0.3 + relevance×0.3 + impact×0.25 + clarity×0.15
5. missing_keywords: list exact keywords/phrases from the JD that are absent from the resume.
6. improvements: 3–6 specific, actionable suggestions (not generic advice).

OUTPUT SCHEMA (strict):
{
  "keyword_match": number,
  "relevance": number,
  "impact": number,
  "clarity": number,
  "total": number,
  "missing_keywords": ["string"],
  "improvements": ["string"]
}

SCORING DIMENSIONS:
- keyword_match: How many required technical skills, tools, and domain terms from JD appear in the resume?
- relevance: How well does the experience and summary align with the specific role and responsibilities?
- impact: Are achievements quantified? Do bullet points show measurable business/technical outcomes?
- clarity: Is the resume concise, well-structured, and easy to parse? No redundancy or fluff?

═══════════════════════════════════════════
COMPANY: ${application.company}
ROLE: ${application.role}
═══════════════════════════════════════════

JOB DESCRIPTION:
${application.job_description}

═══════════════════════════════════════════

TAILORED RESUME JSON:
${JSON.stringify(application.resume_json, null, 2)}

═══════════════════════════════════════════

Now output ONLY the JSON score object. Begin immediately with { and end with }.
`.trim();
}

// ─── Improvement Prompt ───────────────────────────────────────────────────────

/**
 * Generates a prompt to get targeted improvement suggestions for the resume.
 * Requires both resume_json and score to be present.
 */
export function generateImprovementPrompt(
  application: ApplicationRecord
): string {
  if (!application.resume_json) {
    throw new Error(
      "Cannot generate improvement prompt: no resume_json present"
    );
  }

  const scoreContext = application.score
    ? `
CURRENT SCORES:
- Keyword Match: ${application.score.keyword_match}/100
- Relevance: ${application.score.relevance}/100
- Impact: ${application.score.impact}/100
- Clarity: ${application.score.clarity}/100
- Total: ${application.score.total}/100

MISSING KEYWORDS: ${(application.missing_keywords ?? []).join(", ") || "None identified"}

PREVIOUS IMPROVEMENT SUGGESTIONS:
${(application.improvements ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n") || "None"}
`
    : "";

  return `
You are a senior technical resume coach. Given the resume, job description, and scoring analysis below, provide a revised and improved version of the resume JSON with all improvements applied.

STRICT RULES:
1. Output ONLY a single valid JSON object containing "resume" and "changes" fields.
2. Do NOT hallucinate new experiences, companies, or skills not in the original resume.
3. You MAY rephrase, reorder, strengthen verbs, add quantification, and incorporate missing keywords naturally.
4. changes: list exactly what you changed and why (max 8 items).

OUTPUT SCHEMA (strict):
{
  "resume": { /* same schema as input resume */ },
  "changes": ["string — what changed and why"]
}

═══════════════════════════════════════════
COMPANY: ${application.company}
ROLE: ${application.role}
═══════════════════════════════════════════

JOB DESCRIPTION:
${application.job_description}
${scoreContext}
═══════════════════════════════════════════

CURRENT RESUME JSON:
${JSON.stringify(application.resume_json, null, 2)}

═══════════════════════════════════════════

Now output ONLY the JSON object. Begin immediately with { and end with }.
`.trim();
}
