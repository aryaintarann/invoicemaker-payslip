import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { employeeInput } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.employees.findFirst({
    where: eq(employees.id, Number(id)),
  });
  if (!row) return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = employeeInput.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { baseSalary, ...rest } = parsed.data;
  const [row] = await db
    .update(employees)
    .set({ ...rest, ...(baseSalary !== undefined ? { baseSalary: String(baseSalary) } : {}) })
    .where(eq(employees.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.delete(employees).where(eq(employees.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
