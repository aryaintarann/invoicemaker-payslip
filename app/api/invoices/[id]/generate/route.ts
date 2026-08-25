import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { fillInvoiceTemplate, TemplateMissingError, TemplateRenderError } from "@/lib/docx";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, Number(id)),
    with: { client: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  try {
    const buffer = await fillInvoiceTemplate({
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

    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.docx"`,
      },
    });
  } catch (error) {
    if (error instanceof TemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TemplateRenderError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
