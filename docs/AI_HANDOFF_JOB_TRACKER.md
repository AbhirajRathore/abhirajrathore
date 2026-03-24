# Job Tracker & Notion — AI Handoff Notes

This document captures **context, decisions, and file-level changes** from the implementation and iteration sessions so another engineer or AI can continue without re-reading the full chat.

---

## 1. Product intent

- **Tracking-first** internal tool inside a Next.js (App Router) portfolio on Vercel.
- Every workflow step (prompts, resume JSON, scoring, PDF, Notion sync) ties to a persistent **`ApplicationRecord`** in **IndexedDB (Dexie)** — not resume-first.
- **Notion** is optional; secrets stay server-side (`NOTION_*` env vars only).

---

## 2. High-level architecture

| Layer | Technology |
|--------|------------|
| UI | `/jobs` dashboard, `/jobs/[id]` detail — React client components + CSS modules (`jobs.module.css`) |
| Storage | Dexie + `useApplicationsStore()` — CRUD, immutability when `status === "applied"` |
| Validation | Zod: `ResumeSchema`, `ScoreSchema`; contact fields normalized for ChatGPT markdown quirks |
| PDF | `@react-pdf/renderer` — shared `renderResumePdfToBuffer()` in `src/lib/renderResumePdf.tsx` |
| Notion | `POST /api/sync-notion` — `@notionhq/client`, DB properties + **page body** (JD, resume text, PDF upload) |

---

## 3. Core data model (`src/lib/types.ts`)

Key fields: `id`, `company`, `role`, `job_description`, timestamps, `resume_json`, `resume_version_id`, `score`, `missing_keywords`, `improvements`, `status`, `notion_synced`, `notion_page_id`, `prompts`.

**Locking:** When `applied`, store strips updates to `resume_json`, `score`, `prompts` (`enforceImmutability` in `useApplicationsStore.ts`).

---

## 4. File map (important paths)

```
src/
├── app/
│   ├── jobs/page.tsx              # Dashboard + bulk Notion selection/sync
│   ├── jobs/[id]/page.tsx         # Detail shell
│   ├── api/sync-notion/route.ts   # Notion DB row + page body + PDF
│   └── api/generate-pdf/route.ts  # Thin wrapper → renderResumePdfToBuffer
├── components/jobs/               # ApplicationCreator, ApplicationTable, ApplicationDetailView,
│                                  # PromptPanel, JSONInputPanel, ScorePanel, ResumeBuilder, StatusController
├── hooks/useApplicationsStore.ts
├── lib/
│   ├── types.ts, config.ts, db.ts, schemas.ts, utils.ts
│   ├── promptTemplates.ts         # Strict JSON prompts; contact-field rules for ChatGPT
│   ├── masterResume.ts
│   ├── latexTemplate.ts
│   ├── notionSyncPayload.ts       # buildNotionSyncRequestBody(), isNotionSyncEligible()
│   ├── notionSyncPageContent.ts   # Clears row page body; JD + resume blocks; PDF via fileUploads API
│   └── renderResumePdf.tsx        # Shared PDF document (was duplicated in generate-pdf)
```

---

## 5. Notion setup (operator checklist)

### Environment

- `.env.local`: `NOTION_API_KEY`, `NOTION_DATABASE_ID` (never commit real keys).
- `.env.local.example` is a **template only** — do not put live tokens there (they get committed).

### Database properties (exact names)

The API expects these **property names** on the Notion database:

| Property | Type |
|----------|------|
| Name | Title |
| Company, Role, Application ID, Resume Version, Missing Keywords | Text (API: `rich_text`) |
| Status | Select — options exactly: `📝 Draft`, `✅ Ready`, `📤 Applied`, `🎯 Interview`, `❌ Rejected` |
| Created At, Applied At | Date |
| Score | Number |

### Integration connection

- Database must be **connected** to the integration (Connections menu). Otherwise API returns 404 / permission errors.

### What sync does now (post-iteration)

1. **Updates/creates** the database row (properties as before).
2. **Replaces all block children** of the **row’s page** (open row → page body):
   - Callout: content synced from Job Tracker; re-sync overwrites below.
   - **Job description** (full text, chunked paragraphs).
   - **Tailored resume** as structured text (summary, skills, experience, education, projects).
   - **PDF**: generated server-side, uploaded via `notion.fileUploads.create` → `send` → poll `retrieve` until `uploaded`, then **PDF block** with `file_upload` id.

Response JSON includes `page_content: { pdf_attached, pdf_error?, body_error? }` for debugging.

**Caveat:** Re-sync **wipes** existing body blocks on that row page — manual notes there will be lost.

---

## 6. Features & fixes (chronological summary)

1. **Initial build** — Full job tracker: Dexie store, prompts, Zod, LaTeX + PDF route, Notion route, dashboard, detail, workflow.
2. **Contact fields** — ChatGPT emitted `[email](mailto:...)`; added `normalizeEmailString` / phone / linkedin preprocessors in `schemas.ts` + stricter rules in `promptTemplates.ts` + UI copy in `JSONInputPanel.tsx`.
3. **Score tab** — Copy resume JSON, copy JD, **Copy scoring prompt** (persists `scoring_prompt` when not applied).
4. **Dashboard bulk Notion** — Checkboxes for `applied && !notion_synced`; header selects eligible rows in current filter; `Sync N to Notion`; skips already synced; `src/lib/notionSyncPayload.ts` shared with detail view.
5. **Notion operator help** — User verified schema via Notion AI; API GET database confirmed after **Connections** fixed 404.
6. **JD + PDF on Notion** — Previously only DB properties; extended sync payload with `job_description` + `resume_json`, added `notionSyncPageContent.ts`, refactored PDF into `renderResumePdf.tsx`.

---

## 7. Eligibility rules

- **Bulk / detail “Sync to Notion”** (as implemented): typically **`applied`** and **`!notion_synced`** for bulk; detail page also ties auto-sync on mark applied.
- **`buildNotionSyncRequestBody`** must stay the single source of truth for POST body shape so client and server stay aligned.

---

## 8. Commands

```bash
npm run dev    # next dev (use -H 127.0.0.1 if networkInterfaces errors on some hosts)
npm run build
npx tsc --noEmit
```

---

## 9. Suggested continuations (not done here)

- Surface `page_content.pdf_error` / `body_error` in the UI (toast or inline) after sync.
- Optional: avoid wiping user-edited Notion body (e.g. sync into a single synced_block or named section only — harder with Notion API).
- Rate-limit handling for mass block delete + append on huge JDs.
- If Notion changes API version defaults, confirm `Client` `notionVersion` vs file upload behavior.

---

## 10. Security reminder

- Rotate any API key that was ever pasted into `.env.local.example` or chat.
- Production: set `NOTION_*` in **Vercel project env**, not in client bundles.

---

*Generated as a handoff artifact for continuity across AI sessions and contributors.*
