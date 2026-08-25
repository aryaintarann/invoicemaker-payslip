import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { fillPayslipTemplate, TemplateMissingError } from "@/lib/excel";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payslip = await db.query.payslips.findFirst({
    where: eq(payslips.id, Number(id)),
    with: { employee: true },
  });
  if (!payslip) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });

  try {
    const buffer = await fillPayslipTemplate({
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
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="slip-gaji-${safeName}.xlsx"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    if (error instanceof TemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
