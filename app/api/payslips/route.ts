import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { payslipInput } from "@/lib/validators";

function computeTotal(input: {
  gajiPokok: number;
  uangTransportMakanPerHari: number;
  jumlahHariKerja: number;
  biayaBpjs: number;
  biayaBpjsJht: number;
}) {
  const totalPendapatan =
    input.gajiPokok + input.uangTransportMakanPerHari * input.jumlahHariKerja + input.biayaBpjs;
  return totalPendapatan - input.biayaBpjsJht;
}

export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const period = req.nextUrl.searchParams.get("period");

  const rows = await db.query.payslips.findMany({
    where: (t, { and, eq }) => {
      const conditions = [];
      if (employeeId) conditions.push(eq(t.employeeId, Number(employeeId)));
      if (period) conditions.push(eq(t.period, period));
      return conditions.length ? and(...conditions) : undefined;
    },
    with: { employee: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payslipInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const total = computeTotal(parsed.data);

  const [row] = await db
    .insert(payslips)
    .values({
      employeeId: parsed.data.employeeId,
      period: parsed.data.period,
      issueDate: parsed.data.issueDate,
      jumlahHariKerja: parsed.data.jumlahHariKerja,
      gajiPokok: String(parsed.data.gajiPokok),
      uangTransportMakanPerHari: String(parsed.data.uangTransportMakanPerHari),
      biayaBpjs: String(parsed.data.biayaBpjs),
      biayaBpjsJht: String(parsed.data.biayaBpjsJht),
      total: String(total),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
