"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

const statuses = ["", "draft", "sent", "paid", "overdue"] as const;

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

export default function InvoicesPage() {
  const [status, setStatus] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", status],
    queryFn: () => invoicesApi.list(status || undefined),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <Link href="/invoices/new" className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black">
          + Invoice Baru
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {statuses.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1 rounded-full border ${
              status === s
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border-black/20 dark:border-white/20"
            }`}
          >
            {s ? statusLabel[s] : "Semua"}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-black/60">Memuat...</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">No. Invoice</th>
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Proyek</th>
              <th className="py-2 pr-4">Jatuh Tempo</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((inv) => (
              <tr key={inv.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/invoices/${inv.id}`} className="hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{inv.client?.name}</td>
                <td className="py-2 pr-4">
                  {inv.projectName} · {inv.entity.toUpperCase()} · {inv.invoiceLabel}
                </td>
                <td className="py-2 pr-4">{inv.dueDate}</td>
                <td className="py-2 pr-4">{statusLabel[inv.status]}</td>
                <td className="py-2 pr-4">{formatCurrency(inv.total)}</td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-black/50">
                  Belum ada invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
