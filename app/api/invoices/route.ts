import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { defaultPpnPercent, DEFAULT_PPH_PERCENT, invoiceHasTax } from "@/lib/invoice-tax";
import { invoiceInput } from "@/lib/validators";

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

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  const rows = await db.query.invoices.findMany({
    where: status
      ? (t, { eq }) => eq(t.status, status as "draft" | "sent" | "paid" | "overdue")
      : undefined,
    with: { client: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
    columns: { taxWithholdingDocFile: false, taxInvoiceDocFile: false },
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
  const hasTax = invoiceHasTax(rest.entity, rest.kind, rest.language);
  const amounts = computeAmounts({
    contractValue: rest.contractValue,
    invoicePercent: rest.invoicePercent,
    entity: rest.entity,
    kind: rest.kind,
    language: rest.language,
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
      ppnPercent: hasTax ? String(ppnPercent ?? defaultPpnPercent(rest.kind, rest.language)) : null,
      pphPercent: hasTax ? String(pphPercent ?? DEFAULT_PPH_PERCENT) : null,
      ppnAmount: amounts.ppnAmount != null ? String(amounts.ppnAmount) : null,
      pphAmount: amounts.pphAmount != null ? String(amounts.pphAmount) : null,
      total: String(amounts.total),
    })
    .returning();

  const full = await db.query.invoices.findFirst({
    where: (t, { eq }) => eq(t.id, invoice.id),
    with: { client: true },
    columns: { taxWithholdingDocFile: false, taxInvoiceDocFile: false },
  });

  return NextResponse.json(full, { status: 201 });
}
