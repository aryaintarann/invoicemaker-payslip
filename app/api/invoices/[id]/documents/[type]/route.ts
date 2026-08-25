import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";

const docTypes = {
  "tax-withholding": {
    file: "taxWithholdingDocFile",
    fileName: "taxWithholdingDocFileName",
    fileType: "taxWithholdingDocFileType",
    uploadedAt: "taxWithholdingDocUploadedAt",
  },
  "tax-invoice": {
    file: "taxInvoiceDocFile",
    fileName: "taxInvoiceDocFileName",
    fileType: "taxInvoiceDocFileType",
    uploadedAt: "taxInvoiceDocUploadedAt",
  },
} as const;

type DocType = keyof typeof docTypes;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Vercel Serverless Functions cap request bodies around 4.5 MB regardless of
// Next.js config, so we keep a margin below that for when this app deploys there.
const maxFileSize = 4 * 1024 * 1024;

function resolveDocType(type: string): DocType | null {
  return type in docTypes ? (type as DocType) : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const docType = resolveDocType(type);
  if (!docType) return NextResponse.json({ error: "Jenis dokumen tidak dikenal" }, { status: 400 });

  const invoiceId = Number(id);
  const existing = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Format file tidak didukung. Gunakan PDF, Word (.doc/.docx), atau Excel (.xls/.xlsx)." },
      { status: 400 }
    );
  }
  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Ukuran file maksimal 4 MB" }, { status: 400 });
  }

  const cols = docTypes[docType];
  const buffer = Buffer.from(await file.arrayBuffer());

  const [row] = await db
    .update(invoices)
    .set({
      [cols.file]: buffer,
      [cols.fileName]: file.name,
      [cols.fileType]: file.type,
      [cols.uploadedAt]: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning({
      fileName: invoices[cols.fileName],
      fileType: invoices[cols.fileType],
      uploadedAt: invoices[cols.uploadedAt],
    });

  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const docType = resolveDocType(type);
  if (!docType) return NextResponse.json({ error: "Jenis dokumen tidak dikenal" }, { status: 400 });

  const invoiceId = Number(id);
  const existing = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  const cols = docTypes[docType];
  await db
    .update(invoices)
    .set({
      [cols.file]: null,
      [cols.fileName]: null,
      [cols.fileType]: null,
      [cols.uploadedAt]: null,
    })
    .where(eq(invoices.id, invoiceId));

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const docType = resolveDocType(type);
  if (!docType) return NextResponse.json({ error: "Jenis dokumen tidak dikenal" }, { status: 400 });

  const invoiceId = Number(id);
  const cols = docTypes[docType];
  const row = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: {
      [cols.file]: true,
      [cols.fileName]: true,
      [cols.fileType]: true,
    } as Record<string, true>,
  });

  if (!row) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  const fileName = row[cols.fileName as keyof typeof row] as string | null;
  const fileType = row[cols.fileType as keyof typeof row] as string | null;
  const fileBuffer = row[cols.file as keyof typeof row] as Buffer | null;

  if (!fileName || !fileBuffer) {
    return NextResponse.json({ error: "Dokumen belum diupload" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": fileType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Content-Length": String(fileBuffer.byteLength),
    },
  });
}
