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

export const invoiceItemInput = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const invoiceInput = z.object({
  clientId: z.coerce.number().int().positive(),
  invoiceNumber: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
  items: z.array(invoiceItemInput).min(1),
});

export const invoiceUpdateInput = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  invoiceNumber: z.string().min(1).optional(),
  issueDate: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
  items: z.array(invoiceItemInput).min(1).optional(),
});

export const payslipInput = z.object({
  employeeId: z.coerce.number().int().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
  baseSalary: z.coerce.number().nonnegative(),
  allowances: z.record(z.string(), z.coerce.number()).optional().default({}),
  deductions: z.record(z.string(), z.coerce.number()).optional().default({}),
});

export const payslipUpdateInput = payslipInput.partial();
