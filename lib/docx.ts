import fs from "node:fs";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { formatCurrency, formatDate } from "./format";

const TEMPLATE_PATH = path.join(process.cwd(), "templates/invoice/template.docx");

export type InvoiceTemplateData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  total: string | number;
  client: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    description: string;
    qty: string | number;
    unitPrice: string | number;
    subtotal: string | number;
  }>;
};

export class TemplateMissingError extends Error {}
export class TemplateRenderError extends Error {}

/**
 * Fills templates/invoice/template.docx (user-supplied, see templates/invoice/README.md
 * for the required placeholder tags) and returns the rendered .docx as a Buffer.
 */
export async function fillInvoiceTemplate(data: InvoiceTemplateData): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new TemplateMissingError(
      "Template invoice belum ditemukan di templates/invoice/template.docx. " +
        "Lihat templates/invoice/README.md untuk format placeholder yang dibutuhkan."
    );
  }

  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const templateData = {
    invoice_number: data.invoiceNumber,
    issue_date: formatDate(data.issueDate),
    due_date: formatDate(data.dueDate),
    status: data.status,
    total: formatCurrency(data.total),
    client_name: data.client.name,
    client_email: data.client.email ?? "",
    client_phone: data.client.phone ?? "",
    client_address: data.client.address ?? "",
    items: data.items.map((item) => ({
      description: item.description,
      qty: item.qty,
      unit_price: formatCurrency(item.unitPrice),
      subtotal: formatCurrency(item.subtotal),
    })),
  };

  try {
    doc.render(templateData);
  } catch (error) {
    const message = extractDocxtemplaterError(error);
    throw new TemplateRenderError(
      `Gagal mengisi template invoice: ${message}. Pastikan tag placeholder di template.docx sesuai templates/invoice/README.md.`
    );
  }

  return doc.toBuffer();
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
