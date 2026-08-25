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
      position: payslip.employee.position,
      period: payslip.period,
      baseSalary: payslip.baseSalary,
      allowances: (payslip.allowances as Record<string, number>) ?? {},
      deductions: (payslip.deductions as Record<string, number>) ?? {},
      total: payslip.total,
    });

    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="slip-gaji-${payslip.employee.name}-${payslip.period}.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof TemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
