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

// Makes LibreOffice/Gotenberg print the sheet on a single page instead of
// spilling columns onto a second page (PDF looked "terpotong"). Injects the
// two print-config elements Excel would write for "Fit Sheet on One Page";
// element order matters (sheetPr must lead the worksheet, pageSetup follows
// pageMargins). Idempotent, and untouched if the template already sets them.
function fitToOnePage(xml: string): string {
  if (!/<sheetPr[\s>]/.test(xml)) {
    xml = xml.replace(
      /(<worksheet\b[^>]*>)/,
      '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
    );
  }
  if (!/<pageSetup[\s/>]/.test(xml)) {
    xml = xml.replace(
      /(<pageMargins\b[^>]*\/>)/,
      '$1<pageSetup orientation="portrait" fitToWidth="1" fitToHeight="1"/>'
    );
  }
  return xml;
}

// Blanks the thin-box border (border index 2 in xl/styles.xml) that the
// template draws around the PENDAPATAN / POTONGAN / TOTAL GAJI rows. Only the
// table styles (5, 7, 9, 10, 11) reference it; the letterhead edge (border 1)
// and the bottom rule (border 3) use different borders and stay intact. Done
// in code so both the .xlsx and the Gotenberg PDF come out borderless there.
function stripTableBorders(zip: PizZip): void {
  const styles = zip.file("xl/styles.xml")!.asText();
  const block = styles.match(/<borders count="\d+">([\s\S]*?)<\/borders>/);
  if (!block) return;
  const items = block[1].match(/<border\b[\s\S]*?<\/border>|<border\s*\/>/g) ?? [];
  if (items.length <= 2) return;
  items[2] = "<border><left/><right/><top/><bottom/><diagonal/></border>";
  zip.file(
    "xl/styles.xml",
    styles.replace(block[0], `<borders count="${items.length}">${items.join("")}</borders>`)
  );
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

  zip.file(SHEET_PATH, fitToOnePage(xml));
  stripTableBorders(zip);
  return zip.generate({ type: "nodebuffer" });
}
