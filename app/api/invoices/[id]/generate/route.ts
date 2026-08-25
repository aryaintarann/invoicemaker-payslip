import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { fillInvoiceTemplate, TemplateMissingError, TemplateRenderError } from "@/lib/docx";
import { convertToPdf, PdfConversionError, PdfServiceUnavailableError } from "@/lib/pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wantsPdf = req.nextUrl.searchParams.get("format") === "pdf";
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, Number(id)),
    with: { client: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  try {
    const docxBuffer = await fillInvoiceTemplate({
      entity: invoice.entity,
      kind: invoice.kind,
      language: invoice.language,
      invoiceNumber: invoice.invoiceNumber,
      invoiceLabel: invoice.invoiceLabel,
      projectName: invoice.projectName,
      issueDate: invoice.issueDate,
      client: invoice.client,
      clientAttn: invoice.clientAttn,
      contractValue: invoice.contractValue,
      invoicePercent: invoice.invoicePercent,
      billedAmount: invoice.billedAmount,
      remainingAmount: invoice.remainingAmount,
      ppnPercent: invoice.ppnPercent,
      pphPercent: invoice.pphPercent,
      ppnAmount: invoice.ppnAmount,
      pphAmount: invoice.pphAmount,
      pphDeadline: invoice.pphDeadline,
      total: invoice.total,
    });

    const safeName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, "_");

    if (wantsPdf) {
      const pdfBuffer = await convertToPdf(docxBuffer, `invoice-${safeName}.docx`);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${safeName}.pdf"`,
          "Content-Length": String(pdfBuffer.byteLength),
        },
      });
    }

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="invoice-${safeName}.docx"`,
        "Content-Length": String(docxBuffer.byteLength),
      },
    });
  } catch (error) {
    if (error instanceof TemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TemplateRenderError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof PdfServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof PdfConversionError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
