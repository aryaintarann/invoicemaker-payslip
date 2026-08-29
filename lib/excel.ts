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

// Blanks every non-empty border in xl/styles.xml: the template drew a thin box
// around the PENDAPATAN/POTONGAN/TOTAL GAJI rows plus a half-finished outer
// rule (only right + bottom, and clipping). We want none of those — the full
// outer box is drawn as a shape in drawOuterBorder(). Also appends a bold-blue
// right-aligned currency xf for the TOTAL GAJI amount and returns its index.
function patchStyles(zip: PizZip): number {
  let styles = zip.file("xl/styles.xml")!.asText();

  const b = styles.match(/<borders count="(\d+)">[\s\S]*?<\/borders>/);
  if (b) {
    const empty = "<border><left/><right/><top/><bottom/><diagonal/></border>";
    styles = styles.replace(b[0], `<borders count="${b[1]}">${empty.repeat(Number(b[1]))}</borders>`);
  }

  const xf = styles.match(/<cellXfs count="(\d+)">/)!;
  const totalRightXf = Number(xf[1]);
  styles = styles
    .replace(/<cellXfs count="\d+">/, `<cellXfs count="${totalRightXf + 1}">`)
    .replace(
      "</cellXfs>",
      '<xf numFmtId="44" fontId="5" fillId="2" borderId="0" xfId="0" applyNumberFormat="1"' +
        ' applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right"/></xf></cellXfs>'
    );

  zip.file("xl/styles.xml", styles);
  return totalRightXf;
}

// #1: extend the TOTAL GAJI blue fill (B16:E16) and right-align the amount in a
// merged C16:E16 so the whole (overflowing) number sits on the highlight.
function extendTotalHighlight(xml: string, totalRightXf: number): string {
  xml = xml.replace(/(<c r="D16"[^>]*?)\ss="\d+"/, '$1 s="10"');
  xml = xml.replace(/(<c r="E16"[^>]*?)\ss="\d+"/, '$1 s="10"');
  xml = xml.replace(/(<c r="C16"[^>]*?)\ss="\d+"/, `$1 s="${totalRightXf}"`);
  if (!xml.includes('ref="C16:E16"')) {
    xml = xml
      .replace(/<mergeCells count="(\d+)">/, (_m, c) => `<mergeCells count="${Number(c) + 1}">`)
      .replace("</mergeCells>", '<mergeCell ref="C16:E16"/></mergeCells>');
  }
  return xml;
}

// #2: draw the full outer box around the slip (A1 top-left to the G/H boundary,
// bottom of row 23) as a no-fill rectangle shape, so it renders identically in
// Excel and the Gotenberg PDF and can't clip like the old cell borders did.
function drawOuterBorder(zip: PizZip): void {
  const p = "xl/drawings/drawing1.xml";
  const f = zip.file(p);
  if (!f) return;
  const xml = f.asText();
  if (xml.includes('name="SlipOuterBorder"')) return;
  const shape =
    "<xdr:twoCellAnchor>" +
    "<xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>" +
    "<xdr:to><xdr:col>7</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>23</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>" +
    '<xdr:sp macro="" textlink=""><xdr:nvSpPr>' +
    '<xdr:cNvPr id="101" name="SlipOuterBorder"/><xdr:cNvSpPr/></xdr:nvSpPr>' +
    '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="6900000" cy="5600000"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' +
    '<a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></xdr:spPr>' +
    "<xdr:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang=\"en-US\"/></a:p></xdr:txBody>" +
    "</xdr:sp><xdr:clientData/></xdr:twoCellAnchor>";
  zip.file(p, xml.replace("</xdr:wsDr>", shape + "</xdr:wsDr>"));
}

// Pin the print range so fit-to-page scaling can't push the outer box off the
// edge; row 24 / col I,J stay in range as a thin blank margin around the box.
function setPrintArea(zip: PizZip): void {
  const wb = zip.file("xl/workbook.xml")!.asText();
  if (wb.includes("_xlnm.Print_Area")) return;
  const dn =
    '<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">Sheet1!$A$1:$H$24</definedName></definedNames>';
  zip.file("xl/workbook.xml", wb.replace("</sheets>", `</sheets>${dn}`));
}

// The signature block (F17:G17 "Badung, <tanggal>", F18 "Diterima Oleh",
// F21 employee name) sits in merged F:G cells that are only ~17 chars wide, so
// the date and longer names clip in both Excel and the PDF. Widen columns F+G.
function widenSignatureCols(xml: string): string {
  if (/<col\b[^>]*\bmin="6"/.test(xml)) return xml;
  const col = '<col min="6" max="7" width="15" customWidth="1"/>';
  if (xml.includes("<cols>")) return xml.replace("<cols>", `<cols>${col}`);
  return xml.replace(/(<sheetFormatPr\b[^>]*\/>)/, `$1<cols>${col}</cols>`);
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
  const totalRightXf = patchStyles(zip);
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

  xml = extendTotalHighlight(xml, totalRightXf);
  zip.file(SHEET_PATH, widenSignatureCols(fitToOnePage(xml)));
  drawOuterBorder(zip);
  setPrintArea(zip);
  return zip.generate({ type: "nodebuffer" });
}
