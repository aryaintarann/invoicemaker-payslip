import { relations } from "drizzle-orm";
import {
  customType,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// drizzle-orm/neon-http has no built-in bytea type. The neon-http driver already
// decodes bytea results into a Buffer, but accepts a "\x"-prefixed hex string on
// the way in — so fromDriver must tolerate either shape defensively.
const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return "\\x" + value.toString("hex");
  },
  fromDriver(value) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value.replace(/^\\x/, ""), "hex");
  },
});

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
]);

export const invoiceEntityEnum = pgEnum("invoice_entity", ["cv", "op"]);
export const invoiceKindEnum = pgEnum("invoice_kind", ["dp", "final"]);
export const invoiceLanguageEnum = pgEnum("invoice_language", ["id", "en"]);

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Progress-billing invoice model matching the CV/OP DP/Final .docx templates:
// a single invoice bills a percentage of a project's total contract value.
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  entity: invoiceEntityEnum("entity").notNull(),
  kind: invoiceKindEnum("kind").notNull(),
  language: invoiceLanguageEnum("language").default("id").notNull(),
  invoiceLabel: varchar("invoice_label", { length: 100 }).notNull(),
  clientAttn: varchar("client_attn", { length: 255 }),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  contractValue: numeric("contract_value", { precision: 16, scale: 2 }).notNull(),
  invoicePercent: numeric("invoice_percent", { precision: 5, scale: 2 }).notNull(),
  billedAmount: numeric("billed_amount", { precision: 16, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 16, scale: 2 }).notNull(),
  // CV-only tax fields (null for OP, which has no PPN/PPh lines in its template).
  ppnPercent: numeric("ppn_percent", { precision: 5, scale: 2 }),
  pphPercent: numeric("pph_percent", { precision: 5, scale: 2 }),
  ppnAmount: numeric("ppn_amount", { precision: 16, scale: 2 }),
  pphAmount: numeric("pph_amount", { precision: 16, scale: 2 }),
  pphDeadline: date("pph_deadline", { mode: "string" }),
  total: numeric("total", { precision: 16, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Supporting tax documents, uploaded after the fact — "status" is derived from
  // presence of *FileName, not stored separately, so it can never drift from the file.
  taxWithholdingDocFile: bytea("tax_withholding_doc_file"),
  taxWithholdingDocFileName: varchar("tax_withholding_doc_file_name", { length: 255 }),
  taxWithholdingDocFileType: varchar("tax_withholding_doc_file_type", { length: 150 }),
  taxWithholdingDocUploadedAt: timestamp("tax_withholding_doc_uploaded_at"),
  taxInvoiceDocFile: bytea("tax_invoice_doc_file"),
  taxInvoiceDocFileName: varchar("tax_invoice_doc_file_name", { length: 255 }),
  taxInvoiceDocFileType: varchar("tax_invoice_doc_file_type", { length: 150 }),
  taxInvoiceDocUploadedAt: timestamp("tax_invoice_doc_uploaded_at"),
});

// Reserved for a future phase (auto/manual follow-up emails) — not populated yet.
export const invoiceFollowups = pgTable("invoice_followups", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  method: varchar("method", { length: 20 }).notNull(),
});

// Matches templates/slip-gaji/template.xlsx's fixed salary structure:
// pendapatan = gajiPokok + (uangTransportMakanPerHari * jumlahHariKerja) + biayaBpjs
// total (gaji bersih) = pendapatan - biayaBpjsJht
export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .references(() => employees.id)
    .notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  jumlahHariKerja: integer("jumlah_hari_kerja").notNull(),
  gajiPokok: numeric("gaji_pokok", { precision: 14, scale: 2 }).notNull(),
  uangTransportMakanPerHari: numeric("uang_transport_makan_per_hari", {
    precision: 14,
    scale: 2,
  }).notNull(),
  biayaBpjs: numeric("biaya_bpjs", { precision: 14, scale: 2 }).default("0").notNull(),
  biayaBpjsJht: numeric("biaya_bpjs_jht", { precision: 14, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  followups: many(invoiceFollowups),
}));

export const invoiceFollowupsRelations = relations(invoiceFollowups, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceFollowups.invoiceId],
    references: [invoices.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  payslips: many(payslips),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
}));
