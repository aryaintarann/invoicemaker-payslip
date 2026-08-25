import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { payslipInput } from "@/lib/validators";

function computeTotal(baseSalary: number, allowances: Record<string, number>, deductions: Record<string, number>) {
  const allowanceSum = Object.values(allowances).reduce((s, v) => s + v, 0);
  const deductionSum = Object.values(deductions).reduce((s, v) => s + v, 0);
  return baseSalary + allowanceSum - deductionSum;
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

  const { baseSalary, allowances, deductions, ...rest } = parsed.data;
  const total = computeTotal(baseSalary, allowances, deductions);

  const [row] = await db
    .insert(payslips)
    .values({
      ...rest,
      baseSalary: String(baseSalary),
      allowances,
      deductions,
      total: String(total),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
