import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payslips } from "@/db/schema";
import { payslipUpdateInput } from "@/lib/validators";

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

  const merged = {
    gajiPokok: parsed.data.gajiPokok ?? Number(existing.gajiPokok),
    uangTransportMakanPerHari:
      parsed.data.uangTransportMakanPerHari ?? Number(existing.uangTransportMakanPerHari),
    jumlahHariKerja: parsed.data.jumlahHariKerja ?? existing.jumlahHariKerja,
    biayaBpjs: parsed.data.biayaBpjs ?? Number(existing.biayaBpjs),
    biayaBpjsJht: parsed.data.biayaBpjsJht ?? Number(existing.biayaBpjsJht),
  };
  const total = computeTotal(merged);

  const [row] = await db
    .update(payslips)
    .set({
      ...(parsed.data.employeeId !== undefined ? { employeeId: parsed.data.employeeId } : {}),
      ...(parsed.data.period !== undefined ? { period: parsed.data.period } : {}),
      ...(parsed.data.issueDate !== undefined ? { issueDate: parsed.data.issueDate } : {}),
      jumlahHariKerja: merged.jumlahHariKerja,
      gajiPokok: String(merged.gajiPokok),
      uangTransportMakanPerHari: String(merged.uangTransportMakanPerHari),
      biayaBpjs: String(merged.biayaBpjs),
      biayaBpjsJht: String(merged.biayaBpjsJht),
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
