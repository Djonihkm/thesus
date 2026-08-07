// src/app/api/memoires/[id]/export/docx/route.ts
import { NextResponse } from "next/server";
import { loadMemoireForExport, exportFilename } from "@/lib/document-export";
import { convertHtmlToDocx, DocxExportError } from "@/lib/docx-export";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await loadMemoireForExport(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  try {
    const docxBuffer = await convertHtmlToDocx(
      result.memoire.editableContent as string,
      result.memoire.title,
      id,
    );

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(exportFilename(result.memoire.title, "docx"))}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof DocxExportError ? error.message : "L'export DOCX a échoué.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
