import fs from "node:fs";
import path from "node:path";

import PizZip from "pizzip";

import { formatCurrency, formatDate } from "./format";

const TEMPLATE_PATH = path.join(process.cwd(), "templates/slip-gaji/template.xlsx");
const SHEET_PATH = "xl/worksheets/sheet1.xml";

export type PayslipTemplateData = {
  employeeName: string;
  issueDate: string;
  jumlahHariKerja: number;
  gajiPokok: string | number;
  uangTransportMakanPerHari: string | number;
  biayaBpjs: string | number;
  biayaBpjsJht: string | number;
  total: string | number;
};

export class TemplateMissingError extends Error {}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Replaces a single <c r="REF" .../> or <c r="REF" ...>...</c> cell element
// with fresh content, keeping its existing style (s="N") attribute and
// leaving every other part of the workbook (styles, drawings, images)
// untouched. ExcelJS's read+write roundtrip silently drops text-box shapes
// (e.g. the letterhead contact info box), so we edit the sheet XML directly
// instead of loading the workbook into ExcelJS.
function setCell(xml: string, ref: string, value: string | number): string {
  const re = new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>[\\s\\S]*?</c>)`);
  const match = xml.match(re);
  if (!match) {
    throw new Error(`Cell ${ref} not found in ${SHEET_PATH}`);
  }
  const attrs = match[1].replace(/\st="[^"]*"/, "");
  const newCell =
    typeof value === "number"
      ? `<c r="${ref}"${attrs}><v>${value}</v></c>`
      : `<c r="${ref}"${attrs} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  return xml.slice(0, match.index) + newCell + xml.slice(match.index! + match[0].length);
}

/**
 * Fills templates/slip-gaji/template.xlsx (user-supplied, see
 * templates/slip-gaji/README.md for the exact cell layout it expects) and
 * returns the rendered .xlsx as a Buffer.
 */
export async function fillPayslipTemplate(data: PayslipTemplateData): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new TemplateMissingError(
      "Template slip gaji belum ditemukan di templates/slip-gaji/template.xlsx. " +
        "Lihat templates/slip-gaji/README.md."
    );
  }

  const gajiPokok = Number(data.gajiPokok);
  const transportTotal = Number(data.uangTransportMakanPerHari) * data.jumlahHariKerja;
  const biayaBpjs = Number(data.biayaBpjs);
  const biayaBpjsJht = Number(data.biayaBpjsJht);
  const totalPendapatan = gajiPokok + transportTotal + biayaBpjs;
  const tanggal = formatDate(data.issueDate);
  const tanggalTtd = `Badung, ${tanggal}`;

  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);
  let xml = zip.file(SHEET_PATH)!.asText();

  xml = setCell(xml, "A3", tanggal);
  xml = setCell(xml, "C5", data.employeeName);
  xml = setCell(xml, "C6", data.jumlahHariKerja);
  xml = setCell(xml, "C9", formatCurrency(gajiPokok));
  xml = setCell(xml, "C10", formatCurrency(transportTotal));
  xml = setCell(xml, "C11", formatCurrency(biayaBpjs));
  xml = setCell(xml, "C12", formatCurrency(totalPendapatan));
  xml = setCell(xml, "C14", formatCurrency(biayaBpjsJht));
  xml = setCell(xml, "C16", formatCurrency(Number(data.total)));
  xml = setCell(xml, "F17", tanggalTtd);
  xml = setCell(xml, "F21", data.employeeName);

  zip.file(SHEET_PATH, xml);
  return zip.generate({ type: "nodebuffer" });
}
