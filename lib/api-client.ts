async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.formErrors?.join(", ") || body.error || `Request gagal (${res.status})`);
  }
  return res.json();
}

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

export type Employee = {
  id: number;
  name: string;
  position: string | null;
  baseSalary: string;
  createdAt: string;
};

export type Invoice = {
  id: number;
  clientId: number;
  invoiceNumber: string;
  entity: "cv" | "op";
  kind: "dp" | "termin1" | "termin2" | "final";
  language: "id" | "en";
  invoiceLabel: string;
  clientAttn: string | null;
  projectName: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  contractValue: string;
  invoicePercent: string;
  billedAmount: string;
  remainingAmount: string;
  ppnPercent: string | null;
  pphPercent: string | null;
  ppnAmount: string | null;
  pphAmount: string | null;
  pphDeadline: string | null;
  total: string;
  createdAt: string;
  client?: Client;
  taxWithholdingDocFileName: string | null;
  taxWithholdingDocFileType: string | null;
  taxWithholdingDocUploadedAt: string | null;
  taxInvoiceDocFileName: string | null;
  taxInvoiceDocFileType: string | null;
  taxInvoiceDocUploadedAt: string | null;
};

export type InvoiceDocumentType = "tax-withholding" | "tax-invoice";

export type Payslip = {
  id: number;
  employeeId: number;
  period: string;
  issueDate: string;
  jumlahHariKerja: number;
  gajiPokok: string;
  uangTransportMakanPerHari: string;
  biayaBpjs: string;
  biayaBpjsJht: string;
  total: string;
  createdAt: string;
  employee?: Employee;
};

export const clientsApi = {
  list: () => request<Client[]>("/api/clients"),
  get: (id: number) => request<Client>(`/api/clients/${id}`),
  create: (data: Partial<Client>) =>
    request<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<{ ok: true }>(`/api/clients/${id}`, { method: "DELETE" }),
};

export const employeesApi = {
  list: () => request<Employee[]>("/api/employees"),
  get: (id: number) => request<Employee>(`/api/employees/${id}`),
  create: (data: Partial<Employee>) =>
    request<Employee>("/api/employees", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Employee>) =>
    request<Employee>(`/api/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<{ ok: true }>(`/api/employees/${id}`, { method: "DELETE" }),
};

export const invoicesApi = {
  list: (status?: string) =>
    request<Invoice[]>(`/api/invoices${status ? `?status=${status}` : ""}`),
  get: (id: number) => request<Invoice>(`/api/invoices/${id}`),
  create: (data: unknown) =>
    request<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request<Invoice>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  markPaid: (id: number) =>
    request<Invoice>(`/api/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "paid" }),
    }),
  remove: (id: number) => request<{ ok: true }>(`/api/invoices/${id}`, { method: "DELETE" }),
  uploadDocument: async (id: number, type: InvoiceDocumentType, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/invoices/${id}/documents/${type}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload gagal (${res.status})`);
    }
    return res.json();
  },
  removeDocument: (id: number, type: InvoiceDocumentType) =>
    request<{ ok: true }>(`/api/invoices/${id}/documents/${type}`, { method: "DELETE" }),
};

export const payslipsApi = {
  list: (params?: { employeeId?: number; period?: string }) => {
    const qs = new URLSearchParams();
    if (params?.employeeId) qs.set("employeeId", String(params.employeeId));
    if (params?.period) qs.set("period", params.period);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Payslip[]>(`/api/payslips${suffix}`);
  },
  get: (id: number) => request<Payslip>(`/api/payslips/${id}`),
  create: (data: unknown) =>
    request<Payslip>("/api/payslips", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request<Payslip>(`/api/payslips/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<{ ok: true }>(`/api/payslips/${id}`, { method: "DELETE" }),
};
