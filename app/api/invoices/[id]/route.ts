import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { invoiceUpdateInput } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.invoices.findFirst({
    where: eq(invoices.id, Number(id)),
    with: { client: true, items: true },
  });
  if (!row) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);
  const body = await req.json();
  const parsed = invoiceUpdateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
  if (!existing) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  const { items, status, ...rest } = parsed.data;

  // Mark-paid transition, allowed from sent/overdue regardless of other edits.
  if (status === "paid") {
    if (existing.status !== "sent" && existing.status !== "overdue") {
      return NextResponse.json(
        { error: "Hanya invoice berstatus sent/overdue yang bisa ditandai paid" },
        { status: 409 }
      );
    }
    const [row] = await db
      .update(invoices)
      .set({ status: "paid" })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return NextResponse.json(row);
  }

  // Any other edit (fields/items/status change) is only allowed while draft.
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Invoice hanya bisa diedit selagi berstatus draft" },
      { status: 409 }
    );
  }

  let total: string | undefined;
  if (items) {
    total = String(items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0));
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await db.insert(invoiceItems).values(
      items.map((item) => ({
        invoiceId,
        description: item.description,
        qty: String(item.qty),
        unitPrice: String(item.unitPrice),
        subtotal: String(item.qty * item.unitPrice),
      }))
    );
  }

  const [row] = await db
    .update(invoices)
    .set({
      ...rest,
      ...(status ? { status } : {}),
      ...(total !== undefined ? { total } : {}),
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  const full = await db.query.invoices.findFirst({
    where: eq(invoices.id, row.id),
    with: { client: true, items: true },
  });
  return NextResponse.json(full);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);

  const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
  if (!existing) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Hanya invoice berstatus draft yang bisa dihapus" },
      { status: 409 }
    );
  }

  await db.delete(invoices).where(eq(invoices.id, invoiceId));
  return NextResponse.json({ ok: true });
}
