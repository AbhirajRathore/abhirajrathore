import type { ApplicationRecord } from "./types";

/** Body shape expected by POST /api/sync-notion */
export function buildNotionSyncRequestBody(app: ApplicationRecord) {
  return {
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
    score_total: app.score?.total,
    applied_at: app.applied_at,
    created_at: app.created_at,
    notion_page_id: app.notion_page_id,
    resume_version_id: app.resume_version_id,
    missing_keywords: app.missing_keywords,
    job_description: app.job_description,
    resume_json: app.resume_json,
  };
}

/** Only applied applications that are not yet synced can be pushed to Notion. */
export function isNotionSyncEligible(app: ApplicationRecord): boolean {
  return app.status === "applied" && !app.notion_synced;
}
