"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { clientsApi, invoicesApi } from "@/lib/api-client";

const kindDefaultLabel: Record<string, string> = {
  dp: "DP (Down Payment)",
  final: "Final",
};

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const [form, setForm] = useState({
    clientId: "",
    invoiceNumber: "",
    entity: "op" as "cv" | "op",
    kind: "final" as "dp" | "final",
    invoiceLabel: "Final",
    clientAttn: "",
    projectName: "",
    issueDate: "",
    dueDate: "",
    status: "draft" as "draft" | "sent",
    contractValue: "",
    invoicePercent: "100",
    ppnPercent: "11",
    pphPercent: "6",
    pphDeadline: "",
  });

  const preview = useMemo(() => {
    const contractValue = Number(form.contractValue || 0);
    const percent = Number(form.invoicePercent || 0);
    const billed = (contractValue * percent) / 100;
    const remaining = contractValue - billed;
    if (form.entity === "op") {
      return { billed, remaining, ppn: 0, pph: 0, total: billed };
    }
    const ppn = (billed * Number(form.ppnPercent || 0)) / 100;
    const pph = (billed * Number(form.pphPercent || 0)) / 100;
    return { billed, remaining, ppn, pph, total: billed + ppn - pph };
  }, [form]);

  const mutation = useMutation({
    mutationFn: () =>
      invoicesApi.create({
        ...form,
        contractValue: Number(form.contractValue),
        invoicePercent: Number(form.invoicePercent),
        ppnPercent: form.entity === "cv" ? Number(form.ppnPercent) : undefined,
        pphPercent: form.entity === "cv" ? Number(form.pphPercent) : undefined,
        pphDeadline: form.entity === "cv" ? form.pphDeadline || undefined : undefined,
      }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push(`/invoices/${invoice.id}`);
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Invoice Baru</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
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

        <div className="grid grid-cols-2 gap-4">
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
        </div>

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
              onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "sent" })}
            >
              <option value="draft">Draft</option>
              <option value="sent">Terkirim</option>
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

        {form.entity === "cv" && (
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
          {form.entity === "cv" && (
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

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50 w-fit"
        >
          {mutation.isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
