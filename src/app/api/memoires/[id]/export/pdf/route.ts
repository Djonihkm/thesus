// src/app/api/memoires/[id]/export/pdf/route.ts
import { NextResponse } from "next/server";
import { loadMemoireForExport, exportFilename } from "@/lib/document-export";
import { convertHtmlToPdf, PdfExportError } from "@/lib/pdf-export";

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
    const pdfBuffer = await convertHtmlToPdf(
      result.memoire.editableContent as string,
      result.memoire.title,
      id,
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(exportFilename(result.memoire.title, "pdf"))}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof PdfExportError ? error.message : "L'export PDF a échoué.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
