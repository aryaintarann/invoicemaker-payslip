import fs from "node:fs";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { formatDate } from "./format";
import { terbilang } from "./terbilang";

export type InvoiceTemplateData = {
  entity: "cv" | "op";
  kind: "dp" | "final";
  language: "id" | "en";
  invoiceNumber: string;
  invoiceLabel: string;
  projectName: string;
  issueDate: string;
  client: {
    name: string;
  };
  clientAttn?: string | null;
  contractValue: string | number;
  invoicePercent: string | number;
  billedAmount: string | number;
  remainingAmount: string | number;
  ppnPercent?: string | number | null;
  pphPercent?: string | number | null;
  ppnAmount?: string | number | null;
  pphAmount?: string | number | null;
  pphDeadline?: string | null;
  total: string | number;
};

export class TemplateMissingError extends Error {}
export class TemplateRenderError extends Error {}

function templatePath(entity: string, language: string, kind: string) {
  return path.join(process.cwd(), "templates/invoice", entity, language, `${kind}.docx`);
}

/**
 * Fills templates/invoice/{entity}/{language}/{kind}.docx (user-supplied) and
 * returns the rendered .docx as a Buffer. See templates/invoice/README.md.
 */
export async function fillInvoiceTemplate(data: InvoiceTemplateData): Promise<Buffer> {
  const templateFile = templatePath(data.entity, data.language, data.kind);
  if (!fs.existsSync(templateFile)) {
    throw new TemplateMissingError(
      `Template invoice belum ditemukan di templates/invoice/${data.entity}/${data.language}/${data.kind}.docx. ` +
        "Lihat templates/invoice/README.md."
    );
  }

  const content = fs.readFileSync(templateFile, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const templateData = {
    invoice_number: data.invoiceNumber,
    invoice_label: data.invoiceLabel,
    project_name: data.projectName,
    issue_date: formatDate(data.issueDate, data.language),
    client_name: data.client.name,
    client_attn: data.clientAttn ?? "",
    invoice_percent: formatPercent(data.invoicePercent),
    contract_value: formatAmount(data.contractValue),
    billed_amount: formatAmount(data.billedAmount),
    remaining_amount: formatAmount(data.remainingAmount),
    ppn_percent: data.ppnPercent != null ? formatPercent(data.ppnPercent) : "",
    pph_percent: data.pphPercent != null ? formatPercent(data.pphPercent) : "",
    ppn_amount: data.ppnAmount != null ? formatAmount(data.ppnAmount) : "",
    pph_amount: data.pphAmount != null ? formatAmount(data.pphAmount) : "",
    pph_deadline: data.pphDeadline ? formatDate(data.pphDeadline, data.language) : "",
    total_billed: formatAmount(data.total),
    terbilang: terbilang(data.total, data.language),
  };

  try {
    doc.render(templateData);
  } catch (error) {
    const message = extractDocxtemplaterError(error);
    throw new TemplateRenderError(
      `Gagal mengisi template invoice: ${message}. Pastikan tag placeholder di template sesuai templates/invoice/README.md.`
    );
  }

  return doc.toBuffer();
}

// Templates format amounts as "Rp.<amount>,-" so the tag itself is just the
// number, formatted with thousands separators (no leading "Rp" / trailing "-").
function formatAmount(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function formatPercent(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function extractDocxtemplaterError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "properties" in error &&
    error.properties &&
    typeof error.properties === "object" &&
    "errors" in error.properties &&
    Array.isArray((error.properties as { errors: unknown }).errors)
  ) {
    const errors = (error.properties as { errors: Array<{ message?: string }> }).errors;
    return errors.map((e) => e.message).filter(Boolean).join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}
