import { NextRequest, NextResponse } from "next/server";
import { ResumeSchema } from "@/lib/schemas";
import { renderResumePdfToBuffer } from "@/lib/renderResumePdf";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ResumeSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message);
    return NextResponse.json(
      { error: "Resume validation failed", details: errors },
      { status: 422 }
    );
  }

  try {
    const buffer = await renderResumePdfToBuffer(parsed.data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${parsed.data.name.replace(/\s+/g, "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    console.error("[generate-pdf]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
