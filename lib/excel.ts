import fs from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";

import { formatCurrency, formatDate } from "./format";

const TEMPLATE_PATH = path.join(process.cwd(), "templates/slip-gaji/template.xlsx");

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

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const ws = workbook.getWorksheet("Sheet1") ?? workbook.worksheets[0];

  const gajiPokok = Number(data.gajiPokok);
  const transportTotal = Number(data.uangTransportMakanPerHari) * data.jumlahHariKerja;
  const biayaBpjs = Number(data.biayaBpjs);
  const biayaBpjsJht = Number(data.biayaBpjsJht);
  const totalPendapatan = gajiPokok + transportTotal + biayaBpjs;

  const tanggal = `Badung, ${formatDate(data.issueDate)}`;

  ws.getCell("A3").value = tanggal;
  ws.getCell("C5").value = data.employeeName;
  ws.getCell("C6").value = data.jumlahHariKerja;
  ws.getCell("C9").value = formatCurrency(gajiPokok);
  ws.getCell("C10").value = formatCurrency(transportTotal);
  ws.getCell("C11").value = formatCurrency(biayaBpjs);
  ws.getCell("C12").value = formatCurrency(totalPendapatan);
  ws.getCell("C14").value = formatCurrency(biayaBpjsJht);
  ws.getCell("C16").value = formatCurrency(Number(data.total));
  // F17:G17 and F21:G21 are merged — only the anchor (top-left) cell is writable.
  ws.getCell("F17").value = tanggal;
  ws.getCell("F21").value = data.employeeName;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
