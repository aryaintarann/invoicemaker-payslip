import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { invoiceInput } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  const rows = await db.query.invoices.findMany({
    where: status
      ? (t, { eq }) =>
          eq(t.status, status as "draft" | "sent" | "paid" | "overdue")
      : undefined,
    with: { client: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = invoiceInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...invoiceData } = parsed.data;
  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  // neon-http driver does not support interactive transactions; inserts run
  // sequentially. Acceptable tradeoff for a single-user personal-use app.
  const [invoice] = await db
    .insert(invoices)
    .values({
      ...invoiceData,
      status: invoiceData.status ?? "draft",
      total: String(total),
    })
    .returning();

  await db.insert(invoiceItems).values(
    items.map((item) => ({
      invoiceId: invoice.id,
      description: item.description,
      qty: String(item.qty),
      unitPrice: String(item.unitPrice),
      subtotal: String(item.qty * item.unitPrice),
    }))
  );

  const full = await db.query.invoices.findFirst({
    where: (t, { eq }) => eq(t.id, invoice.id),
    with: { client: true, items: true },
  });

  return NextResponse.json(full, { status: 201 });
}
