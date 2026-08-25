/**
 * Whether an invoice combination includes PPN/PPh lines. Normally only the
 * "cv" entity has tax, but templates/invoice/op/en/final.docx is a real
 * exception in the user's actual templates (English Final invoices for the
 * OP/individual entity still carry PPN 12%/PPh 6%, unlike every other OP
 * variant) — confirmed with the user rather than assumed.
 */
export function invoiceHasTax(
  entity: "cv" | "op",
  kind: "dp" | "final",
  language: "id" | "en"
): boolean {
  return entity === "cv" || (entity === "op" && kind === "final" && language === "en");
}

/** Default PPN percent: the English "Final" templates use 12% instead of the usual 11%. */
export function defaultPpnPercent(kind: "dp" | "final", language: "id" | "en"): number {
  return kind === "final" && language === "en" ? 12 : 11;
}

export const DEFAULT_PPH_PERCENT = 6;
