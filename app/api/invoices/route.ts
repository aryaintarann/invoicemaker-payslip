import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { invoiceInput } from "@/lib/validators";

function computeAmounts(input: {
  contractValue: number;
  invoicePercent: number;
  entity: "cv" | "op";
  ppnPercent?: number;
  pphPercent?: number;
}) {
  const billedAmount = (input.contractValue * input.invoicePercent) / 100;
  const remainingAmount = input.contractValue - billedAmount;

  if (input.entity !== "cv") {
    return { billedAmount, remainingAmount, ppnAmount: null, pphAmount: null, total: billedAmount };
  }

  const ppnPercent = input.ppnPercent ?? 11;
  const pphPercent = input.pphPercent ?? 6;
  const ppnAmount = (billedAmount * ppnPercent) / 100;
  const pphAmount = (billedAmount * pphPercent) / 100;
  const total = billedAmount + ppnAmount - pphAmount;

  return { billedAmount, remainingAmount, ppnAmount, pphAmount, total };
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  const rows = await db.query.invoices.findMany({
    where: status
      ? (t, { eq }) => eq(t.status, status as "draft" | "sent" | "paid" | "overdue")
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

  const { ppnPercent, pphPercent, ...rest } = parsed.data;
  const amounts = computeAmounts({
    contractValue: rest.contractValue,
    invoicePercent: rest.invoicePercent,
    entity: rest.entity,
    ppnPercent,
    pphPercent,
  });

  const [invoice] = await db
    .insert(invoices)
    .values({
      ...rest,
      status: rest.status ?? "draft",
      contractValue: String(rest.contractValue),
      invoicePercent: String(rest.invoicePercent),
      billedAmount: String(amounts.billedAmount),
      remainingAmount: String(amounts.remainingAmount),
      ppnPercent: rest.entity === "cv" ? String(ppnPercent ?? 11) : null,
      pphPercent: rest.entity === "cv" ? String(pphPercent ?? 6) : null,
      ppnAmount: amounts.ppnAmount != null ? String(amounts.ppnAmount) : null,
      pphAmount: amounts.pphAmount != null ? String(amounts.pphAmount) : null,
      total: String(amounts.total),
    })
    .returning();

  const full = await db.query.invoices.findFirst({
    where: (t, { eq }) => eq(t.id, invoice.id),
    with: { client: true },
  });

  return NextResponse.json(full, { status: 201 });
}
