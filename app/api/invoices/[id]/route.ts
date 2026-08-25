import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { defaultPpnPercent, DEFAULT_PPH_PERCENT, invoiceHasTax } from "@/lib/invoice-tax";
import { invoiceUpdateInput } from "@/lib/validators";

function computeAmounts(input: {
  contractValue: number;
  invoicePercent: number;
  entity: "cv" | "op";
  kind: "dp" | "final";
  language: "id" | "en";
  ppnPercent?: number;
  pphPercent?: number;
}) {
  const billedAmount = (input.contractValue * input.invoicePercent) / 100;
  const remainingAmount = input.contractValue - billedAmount;

  if (!invoiceHasTax(input.entity, input.kind, input.language)) {
    return { billedAmount, remainingAmount, ppnAmount: null, pphAmount: null, total: billedAmount };
  }

  const ppnPercent = input.ppnPercent ?? defaultPpnPercent(input.kind, input.language);
  const pphPercent = input.pphPercent ?? DEFAULT_PPH_PERCENT;
  const ppnAmount = (billedAmount * ppnPercent) / 100;
  const pphAmount = (billedAmount * pphPercent) / 100;
  const total = billedAmount + ppnAmount - pphAmount;

  return { billedAmount, remainingAmount, ppnAmount, pphAmount, total };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.invoices.findFirst({
    where: eq(invoices.id, Number(id)),
    with: { client: true },
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

  const { status, ppnPercent, pphPercent, contractValue, invoicePercent, ...rest } = parsed.data;

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

  const needsRecompute =
    contractValue !== undefined ||
    invoicePercent !== undefined ||
    rest.entity !== undefined ||
    rest.kind !== undefined ||
    rest.language !== undefined ||
    ppnPercent !== undefined ||
    pphPercent !== undefined;

  let computed: Record<string, string | null> = {};
  if (needsRecompute) {
    const entity = rest.entity ?? existing.entity;
    const kind = rest.kind ?? existing.kind;
    const language = rest.language ?? existing.language;
    const amounts = computeAmounts({
      contractValue: contractValue ?? Number(existing.contractValue),
      invoicePercent: invoicePercent ?? Number(existing.invoicePercent),
      entity,
      kind,
      language,
      ppnPercent: ppnPercent ?? (existing.ppnPercent ? Number(existing.ppnPercent) : undefined),
      pphPercent: pphPercent ?? (existing.pphPercent ? Number(existing.pphPercent) : undefined),
    });
    const hasTax = invoiceHasTax(entity, kind, language);
    computed = {
      contractValue: String(contractValue ?? existing.contractValue),
      invoicePercent: String(invoicePercent ?? existing.invoicePercent),
      billedAmount: String(amounts.billedAmount),
      remainingAmount: String(amounts.remainingAmount),
      ppnPercent: hasTax
        ? String(ppnPercent ?? existing.ppnPercent ?? defaultPpnPercent(kind, language))
        : null,
      pphPercent: hasTax ? String(pphPercent ?? existing.pphPercent ?? DEFAULT_PPH_PERCENT) : null,
      ppnAmount: amounts.ppnAmount != null ? String(amounts.ppnAmount) : null,
      pphAmount: amounts.pphAmount != null ? String(amounts.pphAmount) : null,
      total: String(amounts.total),
    };
  }

  const [row] = await db
    .update(invoices)
    .set({
      ...rest,
      ...(status !== undefined ? { status } : {}),
      ...computed,
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  const full = await db.query.invoices.findFirst({
    where: eq(invoices.id, row.id),
    with: { client: true },
  });
  return NextResponse.json(full);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);

  const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
  if (!existing) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  await db.delete(invoices).where(eq(invoices.id, invoiceId));
  return NextResponse.json({ ok: true });
}
