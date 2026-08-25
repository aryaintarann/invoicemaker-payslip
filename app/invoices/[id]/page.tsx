"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invoicesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => invoicesApi.get(invoiceId),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => invoicesApi.markPaid(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.remove(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push("/invoices");
    },
  });

  if (!data) return <p className="text-sm text-black/60">Memuat...</p>;

  const canMarkPaid = data.status === "sent" || data.status === "overdue";
  const isDraft = data.status === "draft";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">{data.invoiceNumber}</h1>
        <span className="text-xs px-3 py-1 rounded-full border border-black/20 dark:border-white/20">
          {statusLabel[data.status]}
        </span>
      </div>
      <p className="text-sm text-black/60 mb-6">
        {data.client?.name} · Terbit {data.issueDate} · Jatuh tempo {data.dueDate}
      </p>

      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="text-left border-b border-black/10 dark:border-white/10">
            <th className="py-2 pr-4">Deskripsi</th>
            <th className="py-2 pr-4">Qty</th>
            <th className="py-2 pr-4">Harga Satuan</th>
            <th className="py-2 pr-4">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map((item) => (
            <tr key={item.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-4">{item.description}</td>
              <td className="py-2 pr-4">{item.qty}</td>
              <td className="py-2 pr-4">{formatCurrency(item.unitPrice)}</td>
              <td className="py-2 pr-4">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-right font-medium mb-6">Total: {formatCurrency(data.total)}</p>

      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/invoices/${invoiceId}/generate`}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black"
        >
          Download .docx
        </a>
        {canMarkPaid && (
          <button
            onClick={() => markPaidMutation.mutate()}
            disabled={markPaidMutation.isPending}
            className="rounded border border-black/20 dark:border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Tandai Lunas
          </button>
        )}
        {isDraft && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded border border-red-600 text-red-600 px-4 py-2 text-sm disabled:opacity-50"
          >
            Hapus
          </button>
        )}
      </div>

      {markPaidMutation.isError && (
        <p className="text-sm text-red-600 mt-3">{(markPaidMutation.error as Error).message}</p>
      )}
    </div>
  );
}
