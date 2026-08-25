import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { fillPayslipTemplate, TemplateMissingError } from "@/lib/excel";
import { convertToPdf, PdfConversionError, PdfServiceUnavailableError } from "@/lib/pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wantsPdf = req.nextUrl.searchParams.get("format") === "pdf";
  const payslip = await db.query.payslips.findFirst({
    where: eq(payslips.id, Number(id)),
    with: { employee: true },
  });
  if (!payslip) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });

  try {
    const xlsxBuffer = await fillPayslipTemplate({
      employeeName: payslip.employee.name,
      issueDate: payslip.issueDate,
      jumlahHariKerja: payslip.jumlahHariKerja,
      gajiPokok: payslip.gajiPokok,
      uangTransportMakanPerHari: payslip.uangTransportMakanPerHari,
      biayaBpjs: payslip.biayaBpjs,
      biayaBpjsJht: payslip.biayaBpjsJht,
      total: payslip.total,
    });

    const safeName = `${payslip.employee.name}-${payslip.period}`.replace(/[^a-zA-Z0-9._-]/g, "_");

    if (wantsPdf) {
      const pdfBuffer = await convertToPdf(xlsxBuffer, `slip-gaji-${safeName}.xlsx`);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="slip-gaji-${safeName}.pdf"`,
          "Content-Length": String(pdfBuffer.byteLength),
        },
      });
    }

    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="slip-gaji-${safeName}.xlsx"`,
        "Content-Length": String(xlsxBuffer.byteLength),
      },
    });
  } catch (error) {
    if (error instanceof TemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
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
