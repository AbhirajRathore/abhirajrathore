import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { z } from "zod";
import { ResumeSchema } from "@/lib/schemas";
import { replaceNotionPageSyncContent } from "@/lib/notionSyncPageContent";

// ─── Request Validation ───────────────────────────────────────────────────────

const SyncRequestSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(["draft", "ready", "applied", "interview", "rejected"]),
  score_total: z.number().min(0).max(100).optional(),
  applied_at: z.string().optional(),
  created_at: z.string(),
  notion_page_id: z.string().optional(),
  resume_version_id: z.string().optional(),
  missing_keywords: z.array(z.string()).optional(),
  /** Full job posting text — written to the Notion row page body */
  job_description: z.string().optional(),
  /** Tailored resume — rendered as page text + PDF attachment when valid */
  resume_json: ResumeSchema.optional(),
});

type SyncRequest = z.infer<typeof SyncRequestSchema>;

// ─── Notion Property Builders ─────────────────────────────────────────────────

function buildProperties(data: SyncRequest) {
  const STATUS_EMOJI: Record<string, string> = {
    draft: "📝 Draft",
    ready: "✅ Ready",
    applied: "📤 Applied",
    interview: "🎯 Interview",
    rejected: "❌ Rejected",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {
    Name: {
      title: [{ text: { content: `${data.company} — ${data.role}` } }],
    },
    Company: { rich_text: [{ text: { content: data.company } }] },
    Role: { rich_text: [{ text: { content: data.role } }] },
    Status: {
      select: { name: STATUS_EMOJI[data.status] ?? data.status },
    },
    "Application ID": { rich_text: [{ text: { content: data.id } }] },
    "Created At": { date: { start: data.created_at } },
  };

  if (data.applied_at) {
    props["Applied At"] = { date: { start: data.applied_at } };
  }

  if (data.score_total !== undefined) {
    props["Score"] = { number: data.score_total };
  }

  if (data.resume_version_id) {
    props["Resume Version"] = {
      rich_text: [{ text: { content: data.resume_version_id } }],
    };
  }

  if (data.missing_keywords && data.missing_keywords.length > 0) {
    props["Missing Keywords"] = {
      rich_text: [{ text: { content: data.missing_keywords.join(", ") } }],
    };
  }

  return props;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return NextResponse.json(
      {
        error:
          "Notion integration not configured. Set NOTION_API_KEY and NOTION_DATABASE_ID.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message);
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const notion = new Client({ auth: apiKey });

  try {
    const properties = buildProperties(data);

    let pageId: string;
    let action: "created" | "updated";

    if (data.notion_page_id) {
      await notion.pages.update({
        page_id: data.notion_page_id,
        properties,
      });
      pageId = data.notion_page_id;
      action = "updated";
    } else {
      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
      });
      pageId = page.id;
      action = "created";
    }

    const jd =
      data.job_description?.trim() ||
      "No job description was included with this sync. Re-sync from Job Tracker after saving the application.";

    let pageContent: {
      pdf_attached: boolean;
      pdf_error?: string;
      body_error?: string;
    } = { pdf_attached: false };

    try {
      const syncResult = await replaceNotionPageSyncContent(notion, pageId, {
        jobDescription: jd,
        resumeJson: data.resume_json,
        companySlug: data.company,
        roleSlug: data.role,
      });
      pageContent = {
        pdf_attached: syncResult.pdfAttached,
        ...(syncResult.pdfError ? { pdf_error: syncResult.pdfError } : {}),
      };
    } catch (bodyErr) {
      pageContent = {
        pdf_attached: false,
        body_error:
          bodyErr instanceof Error ? bodyErr.message : "Failed to write page body",
      };
    }

    return NextResponse.json({
      success: true,
      action,
      notion_page_id: pageId,
      page_content: pageContent,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Notion API call failed";
    console.error("[sync-notion]", message, err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
