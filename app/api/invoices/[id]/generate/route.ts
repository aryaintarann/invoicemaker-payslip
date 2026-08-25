import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { fillInvoiceTemplate, TemplateMissingError, TemplateRenderError } from "@/lib/docx";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, Number(id)),
    with: { client: true, items: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  try {
    const buffer = await fillInvoiceTemplate({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      total: invoice.total,
      client: invoice.client,
      items: invoice.items,
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
