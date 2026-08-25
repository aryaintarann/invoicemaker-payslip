"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { clientsApi } from "@/lib/api-client";
import { invoiceHasTax } from "@/lib/invoice-tax";

export type InvoiceFormValues = {
  clientId: string;
  invoiceNumber: string;
  entity: "cv" | "op";
  kind: "dp" | "final";
  language: "id" | "en";
  invoiceLabel: string;
  clientAttn: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  contractValue: string;
  invoicePercent: string;
  ppnPercent: string;
  pphPercent: string;
  pphDeadline: string;
};

export const emptyInvoiceForm: InvoiceFormValues = {
  clientId: "",
  invoiceNumber: "",
  entity: "op",
  kind: "final",
  language: "id",
  invoiceLabel: "Final",
  clientAttn: "",
  projectName: "",
  issueDate: "",
  dueDate: "",
  status: "draft",
  contractValue: "",
  invoicePercent: "100",
  ppnPercent: "11",
  pphPercent: "6",
  pphDeadline: "",
};

const kindDefaultLabel: Record<string, string> = {
  dp: "DP (Down Payment)",
  final: "Final",
};

export function InvoiceForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  pending,
  error,
}: {
  form: InvoiceFormValues;
  setForm: (form: InvoiceFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  error?: string | null;
}) {
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const hasTax = invoiceHasTax(form.entity, form.kind, form.language);

  const preview = useMemo(() => {
    const contractValue = Number(form.contractValue || 0);
    const percent = Number(form.invoicePercent || 0);
    const billed = (contractValue * percent) / 100;
    const remaining = contractValue - billed;
    if (!hasTax) {
      return { billed, remaining, ppn: 0, pph: 0, total: billed };
    }
    const ppn = (billed * Number(form.ppnPercent || 0)) / 100;
    const pph = (billed * Number(form.pphPercent || 0)) / 100;
    return { billed, remaining, ppn, pph, total: billed + ppn - pph };
  }, [form, hasTax]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Client
        <select
          required
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          <option value="">Pilih client</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nama Kontak (opsional, mis. &quot;Bapak Wiwin&quot;)
        <input
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.clientAttn}
          onChange={(e) => setForm({ ...form, clientAttn: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Entity
          <select
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.entity}
            onChange={(e) => setForm({ ...form, entity: e.target.value as "cv" | "op" })}
          >
            <option value="op">OP (Individu, tanpa PPN/PPh)</option>
            <option value="cv">CV (dengan PPN/PPh)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Jenis
          <select
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.kind}
            onChange={(e) => {
              const kind = e.target.value as "dp" | "final";
              setForm({ ...form, kind, invoiceLabel: kindDefaultLabel[kind] });
            }}
          >
            <option value="dp">DP (Down Payment)</option>
            <option value="final">Final</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bahasa
          <select
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value as "id" | "en" })}
          >
            <option value="id">Indonesia</option>
            <option value="en">Inggris</option>
          </select>
        </label>
      </div>
      {form.entity === "op" && form.kind === "final" && form.language === "en" && (
        <p className="text-xs text-black/50 -mt-2">
          Catatan: template OP Final versi Inggris tetap menyertakan PPN/PPh, berbeda dari OP lainnya.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Label Invoice (teks yang tercetak, mis. &quot;1st DP&quot;, &quot;50% DP (Down Payment)&quot;, &quot;Final&quot;)
        <input
          required
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.invoiceLabel}
          onChange={(e) => setForm({ ...form, invoiceLabel: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nama Proyek
        <input
          required
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.projectName}
          onChange={(e) => setForm({ ...form, projectName: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          No. Invoice
          <input
            required
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.invoiceNumber}
            onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "draft" | "sent" | "paid" | "overdue",
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="sent">Terkirim</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Jatuh Tempo</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tanggal Terbit
          <input
            type="date"
            required
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Jatuh Tempo
          <input
            type="date"
            required
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nilai Kontrak (Rp)
          <input
            type="number"
            required
            min={0}
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.contractValue}
            onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Persen Tagihan Ini (%)
          <input
            type="number"
            required
            min={0.01}
            max={100}
            step="any"
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.invoicePercent}
            onChange={(e) => setForm({ ...form, invoicePercent: e.target.value })}
          />
        </label>
      </div>

      {hasTax && (
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            PPN (%)
            <input
              type="number"
              min={0}
              step="any"
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.ppnPercent}
              onChange={(e) => setForm({ ...form, ppnPercent: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            PPh (%)
            <input
              type="number"
              min={0}
              step="any"
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.pphPercent}
              onChange={(e) => setForm({ ...form, pphPercent: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Batas Kirim Bukti Potong
            <input
              type="date"
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.pphDeadline}
              onChange={(e) => setForm({ ...form, pphDeadline: e.target.value })}
            />
          </label>
        </div>
      )}

      <div className="rounded border border-black/10 dark:border-white/10 p-4 text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <span>Jumlah Tagihan</span>
          <span>{preview.billed.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between">
          <span>Sisa</span>
          <span>{preview.remaining.toLocaleString("id-ID")}</span>
        </div>
        {hasTax && (
          <>
            <div className="flex justify-between">
              <span>PPN</span>
              <span>{preview.ppn.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>PPh</span>
              <span>-{preview.pph.toLocaleString("id-ID")}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-medium">
          <span>Total Tagihan</span>
          <span>{preview.total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50 w-fit"
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
