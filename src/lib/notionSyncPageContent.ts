import type { Client } from "@notionhq/client";
import type { BlockObjectRequest } from "@notionhq/client";
import type { ResumeJSON } from "@/lib/types";
import { renderResumePdfToBuffer } from "@/lib/renderResumePdf";

const MAX_RICH_TEXT = 1900;
const APPEND_BATCH = 90;

function chunkText(text: string, maxLen: number): string[] {
  if (!text.trim()) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

function textBlock(content: string): BlockObjectRequest {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: content } }],
    },
  };
}

function heading2(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

function divider(): BlockObjectRequest {
  return { object: "block", type: "divider", divider: {} };
}

function bulletItem(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

function calloutInfo(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: [{ type: "text", text: { content: text } }],
      icon: { type: "emoji", emoji: "📋" },
      color: "gray_background",
    },
  };
}

function buildJobDescriptionBlocks(jobDescription: string): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [
    heading2("Job description"),
    ...chunkText(jobDescription, MAX_RICH_TEXT).map((c) => textBlock(c)),
  ];
  return blocks;
}

function buildResumeTextBlocks(resume: ResumeJSON): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [
    heading2("Tailored resume (text)"),
    heading2(resume.name),
    textBlock(
      `${resume.email} · ${resume.phone} · ${resume.location} · ${resume.linkedin}`
    ),
    heading2("Summary"),
    ...chunkText(resume.summary, MAX_RICH_TEXT).map((c) => textBlock(c)),
    heading2("Skills"),
    ...resume.skills.map((cat) =>
      bulletItem(`${cat.category}: ${cat.skills.join(", ")}`)
    ),
    heading2("Experience"),
  ];

  for (const exp of resume.experience) {
    blocks.push(
      bulletItem(
        `${exp.title} at ${exp.company} (${exp.start_date} – ${exp.end_date}) — ${exp.location}`
      )
    );
    for (const b of exp.bullets) {
      for (const part of chunkText(b, MAX_RICH_TEXT)) {
        blocks.push(bulletItem(part));
      }
    }
  }

  blocks.push(heading2("Education"));
  for (const edu of resume.education) {
    blocks.push(bulletItem(`${edu.degree} — ${edu.institution} (${edu.year})`));
  }

  if (resume.projects?.length) {
    blocks.push(heading2("Projects"));
    for (const p of resume.projects) {
      blocks.push(bulletItem(`${p.name}: ${p.description}`));
      for (const b of p.bullets) blocks.push(bulletItem(b));
    }
  }

  return blocks;
}

function pdfBlockFromUpload(fileUploadId: string): BlockObjectRequest {
  return {
    object: "block",
    type: "pdf",
    pdf: {
      type: "file_upload",
      file_upload: { id: fileUploadId },
      caption: [
        {
          type: "text",
          text: { content: "Resume PDF used for this application (generated from saved resume JSON)" },
        },
      ],
    },
  };
}

async function clearPageBlockChildren(notion: Client, pageId: string): Promise<void> {
  for (;;) {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });
    if (res.results.length === 0) break;
    for (const block of res.results) {
      await notion.blocks.delete({ block_id: block.id });
    }
    if (!res.has_more) break;
  }
}

async function appendBlocksBatched(
  notion: Client,
  pageId: string,
  children: BlockObjectRequest[]
): Promise<void> {
  for (let i = 0; i < children.length; i += APPEND_BATCH) {
    const batch = children.slice(i, i + APPEND_BATCH);
    await notion.blocks.children.append({
      block_id: pageId,
      children: batch,
    });
  }
}

async function uploadPdfForNotion(
  notion: Client,
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  const created = await notion.fileUploads.create({
    mode: "single_part",
    filename,
    content_type: "application/pdf",
  });

  const uploadId = created.id;
  const blob = new Blob([new Uint8Array(pdfBuffer)], {
    type: "application/pdf",
  });

  await notion.fileUploads.send({
    file_upload_id: uploadId,
    file: { filename, data: blob },
  });

  for (let attempt = 0; attempt < 8; attempt++) {
    const done = await notion.fileUploads.retrieve({ file_upload_id: uploadId });
    if (done.status === "uploaded") return uploadId;
    if (done.status === "failed") {
      throw new Error("Notion file upload failed");
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  throw new Error("Notion file upload timed out (still pending)");
}

export interface SyncNotionPageContentOptions {
  jobDescription: string;
  resumeJson?: ResumeJSON;
  companySlug: string;
  roleSlug: string;
}

export interface SyncNotionPageContentResult {
  pdfAttached: boolean;
  pdfError?: string;
}

/**
 * Replaces all block children of the Notion page with JD, resume text, and optional PDF.
 * Warning: removes any existing content on that page body.
 */
export async function replaceNotionPageSyncContent(
  notion: Client,
  pageId: string,
  options: SyncNotionPageContentOptions
): Promise<SyncNotionPageContentResult> {
  const intro = calloutInfo(
    "Synced from Job Tracker. Re-syncing replaces everything below this callout."
  );

  const body: BlockObjectRequest[] = [
    intro,
    divider(),
    ...buildJobDescriptionBlocks(options.jobDescription),
    divider(),
  ];

  let pdfAttached = false;
  let pdfError: string | undefined;

  if (options.resumeJson) {
    body.push(...buildResumeTextBlocks(options.resumeJson));

    try {
      const pdfBuf = await renderResumePdfToBuffer(options.resumeJson);
      const safeCompany = options.companySlug.replace(/[^\w.-]+/g, "-").slice(0, 40);
      const safeRole = options.roleSlug.replace(/[^\w.-]+/g, "-").slice(0, 40);
      const filename = `resume-${safeCompany}-${safeRole}.pdf`;
      const uploadId = await uploadPdfForNotion(notion, Buffer.from(pdfBuf), filename);
      body.push(divider());
      body.push(heading2("Resume PDF"));
      body.push(pdfBlockFromUpload(uploadId));
      pdfAttached = true;
    } catch (e) {
      pdfError = e instanceof Error ? e.message : "PDF upload failed";
      body.push(
        textBlock(
          `(Resume PDF could not be attached: ${pdfError}. Download PDF from the Job Tracker app.)`
        )
      );
    }
  } else {
    body.push(
      textBlock(
        "No resume JSON was on file at sync time — add tailored resume in the app and re-sync to attach text + PDF."
      )
    );
  }

  await clearPageBlockChildren(notion, pageId);
  await appendBlocksBatched(notion, pageId, body);

  return { pdfAttached, pdfError };
}
