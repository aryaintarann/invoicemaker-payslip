import fs from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";

import { formatCurrency } from "./format";

const TEMPLATE_PATH = path.join(process.cwd(), "templates/slip-gaji/template.xlsx");
const CELL_MAP_PATH = path.join(process.cwd(), "templates/slip-gaji/cell-map.json");

export type PayslipTemplateData = {
  employeeName: string;
  position?: string | null;
  period: string;
  baseSalary: string | number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  total: string | number;
};

export class TemplateMissingError extends Error {}

/**
 * Fills templates/slip-gaji/template.xlsx (user-supplied, see templates/slip-gaji/README.md)
 * using named ranges when available, falling back to templates/slip-gaji/cell-map.json.
 * Returns the rendered .xlsx as a Buffer.
 */
export async function fillPayslipTemplate(data: PayslipTemplateData): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new TemplateMissingError(
      "Template slip gaji belum ditemukan di templates/slip-gaji/template.xlsx. " +
        "Lihat templates/slip-gaji/README.md untuk format yang dibutuhkan."
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  const cellMap = loadCellMap();

  const values: Record<string, string> = {
    employee_name: data.employeeName,
    position: data.position ?? "",
    period: data.period,
    base_salary: formatCurrency(data.baseSalary),
    total: formatCurrency(data.total),
  };
  for (const [key, amount] of Object.entries(data.allowances)) {
    values[`allowance_${key}`] = formatCurrency(amount);
  }
  for (const [key, amount] of Object.entries(data.deductions)) {
    values[`deduction_${key}`] = formatCurrency(amount);
  }

  for (const [name, value] of Object.entries(values)) {
    setByName(workbook, name, value, cellMap);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function loadCellMap(): Record<string, string> {
  if (!fs.existsSync(CELL_MAP_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CELL_MAP_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function setByName(
  workbook: ExcelJS.Workbook,
  name: string,
  value: string,
  cellMap: Record<string, string>
) {
  const ranges = workbook.definedNames.getRanges(name);
  if (ranges.ranges.length > 0) {
    const [ref] = ranges.ranges;
    const match = ref.match(/^(?:'([^']+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)/);
    if (match) {
      const sheetName = match[1] ?? match[2];
      const cellAddress = `${match[3]}${match[4]}`;
      const worksheet = workbook.getWorksheet(sheetName);
      if (worksheet) {
        worksheet.getCell(cellAddress).value = value;
        return;
      }
    }
  }

  const mapped = cellMap[name];
  if (mapped) {
    const worksheet = workbook.worksheets[0];
    worksheet.getCell(mapped).value = value;
    return;
  }

  // Component/name not present in the user's template yet — skip gracefully
  // rather than failing the whole generate request.
}
