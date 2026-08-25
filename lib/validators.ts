import { z } from "zod";

export const clientInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const employeeInput = z.object({
  name: z.string().min(1),
  position: z.string().optional(),
  baseSalary: z.coerce.number().nonnegative(),
});

export const invoiceInput = z.object({
  clientId: z.coerce.number().int().positive(),
  invoiceNumber: z.string().min(1),
  entity: z.enum(["cv", "op"]),
  kind: z.enum(["dp", "final"]),
  language: z.enum(["id", "en"]).optional().default("id"),
  invoiceLabel: z.string().min(1),
  clientAttn: z.string().optional(),
  projectName: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
  contractValue: z.coerce.number().nonnegative(),
  invoicePercent: z.coerce.number().positive().max(100),
  ppnPercent: z.coerce.number().nonnegative().optional(),
  pphPercent: z.coerce.number().nonnegative().optional(),
  pphDeadline: z.string().optional(),
});

export const invoiceUpdateInput = invoiceInput.partial();

export const payslipInput = z.object({
  employeeId: z.coerce.number().int().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
  issueDate: z.string().min(1),
  jumlahHariKerja: z.coerce.number().int().nonnegative(),
  gajiPokok: z.coerce.number().nonnegative(),
  uangTransportMakanPerHari: z.coerce.number().nonnegative(),
  biayaBpjs: z.coerce.number().nonnegative().optional().default(0),
  biayaBpjsJht: z.coerce.number().nonnegative().optional().default(0),
});

export const payslipUpdateInput = payslipInput.partial();
