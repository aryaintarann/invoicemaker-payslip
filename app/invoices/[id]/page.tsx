"use client";

import { use } from "react";
import Link from "next/link";
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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">{data.invoiceNumber}</h1>
        <span className="text-xs px-3 py-1 rounded-full border border-black/20 dark:border-white/20">
          {statusLabel[data.status]}
        </span>
      </div>
      <p className="text-sm text-black/60 mb-1">
        {data.client?.name} · {data.entity.toUpperCase()} · {data.invoiceLabel} · {data.projectName}
      </p>
      <p className="text-sm text-black/60 mb-6">
        Terbit {data.issueDate} · Jatuh tempo {data.dueDate}
      </p>

      <table className="w-full text-sm border-collapse mb-4">
        <tbody>
          <tr className="border-b border-black/5 dark:border-white/5">
            <td className="py-2">Nilai Kontrak</td>
            <td className="py-2 text-right">{formatCurrency(data.contractValue)}</td>
          </tr>
          <tr className="border-b border-black/5 dark:border-white/5">
            <td className="py-2">Persen Tagihan ({data.invoicePercent}%)</td>
            <td className="py-2 text-right">{formatCurrency(data.billedAmount)}</td>
          </tr>
          <tr className="border-b border-black/5 dark:border-white/5">
            <td className="py-2">Sisa</td>
            <td className="py-2 text-right">{formatCurrency(data.remainingAmount)}</td>
          </tr>
          {data.entity === "cv" && (
            <>
              <tr className="border-b border-black/5 dark:border-white/5">
                <td className="py-2">PPN ({data.ppnPercent}%)</td>
                <td className="py-2 text-right">+{formatCurrency(data.ppnAmount ?? "0")}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/5">
                <td className="py-2">PPh ({data.pphPercent}%)</td>
                <td className="py-2 text-right">-{formatCurrency(data.pphAmount ?? "0")}</td>
              </tr>
            </>
          )}
          <tr>
            <td className="py-2 font-medium">Total Tagihan</td>
            <td className="py-2 text-right font-medium">{formatCurrency(data.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/invoices/${invoiceId}/generate`}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black"
        >
          Download .docx
        </a>
        <a
          href={`/api/invoices/${invoiceId}/generate?format=pdf`}
          className="rounded border border-black/20 dark:border-white/20 px-4 py-2 text-sm"
        >
          Download PDF
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
        <Link
          href={`/invoices/${invoiceId}/edit`}
          className="rounded border border-black/20 dark:border-white/20 px-4 py-2 text-sm"
        >
          Edit
        </Link>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="rounded border border-red-600 text-red-600 px-4 py-2 text-sm disabled:opacity-50"
        >
          Hapus
        </button>
      </div>

      {markPaidMutation.isError && (
        <p className="text-sm text-red-600 mt-3">{(markPaidMutation.error as Error).message}</p>
      )}
    </div>
  );
}
