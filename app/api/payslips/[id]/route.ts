import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { payslipUpdateInput } from "@/lib/validators";

function computeTotal(baseSalary: number, allowances: Record<string, number>, deductions: Record<string, number>) {
  const allowanceSum = Object.values(allowances).reduce((s, v) => s + v, 0);
  const deductionSum = Object.values(deductions).reduce((s, v) => s + v, 0);
  return baseSalary + allowanceSum - deductionSum;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.payslips.findFirst({
    where: eq(payslips.id, Number(id)),
    with: { employee: true },
  });
  if (!row) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payslipId = Number(id);
  const body = await req.json();
  const parsed = payslipUpdateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.payslips.findFirst({ where: eq(payslips.id, payslipId) });
  if (!existing) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });

  const { baseSalary, allowances, deductions, ...rest } = parsed.data;
  const nextBaseSalary = baseSalary ?? Number(existing.baseSalary);
  const nextAllowances = allowances ?? (existing.allowances as Record<string, number>);
  const nextDeductions = deductions ?? (existing.deductions as Record<string, number>);
  const total = computeTotal(nextBaseSalary, nextAllowances, nextDeductions);

  const [row] = await db
    .update(payslips)
    .set({
      ...rest,
      ...(baseSalary !== undefined ? { baseSalary: String(baseSalary) } : {}),
      ...(allowances !== undefined ? { allowances } : {}),
      ...(deductions !== undefined ? { deductions } : {}),
      total: String(total),
    })
    .where(eq(payslips.id, payslipId))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.delete(payslips).where(eq(payslips.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
