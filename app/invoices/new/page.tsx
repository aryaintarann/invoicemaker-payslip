"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { clientsApi, invoicesApi } from "@/lib/api-client";

type ItemForm = { description: string; qty: string; unitPrice: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const [form, setForm] = useState({
    clientId: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    status: "draft" as "draft" | "sent",
  });
  const [items, setItems] = useState<ItemForm[]>([{ description: "", qty: "1", unitPrice: "0" }]);

  const mutation = useMutation({
    mutationFn: () =>
      invoicesApi.create({
        ...form,
        items: items.map((i) => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
      }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push(`/invoices/${invoice.id}`);
    },
  });

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

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

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Item</span>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { description: "", qty: "1", unitPrice: "0" }])}
              className="text-xs underline"
            >
              + Tambah item
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_120px_28px] gap-2">
                <input
                  placeholder="Deskripsi"
                  required
                  className="border border-black/20 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min={0.01}
                  step="any"
                  required
                  className="border border-black/20 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                  value={item.qty}
                  onChange={(e) => updateItem(i, "qty", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Harga satuan"
                  min={0}
                  required
                  className="border border-black/20 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={items.length === 1}
                  className="text-red-600 text-sm disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
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
