"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { payslipsApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const payslipId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["payslips", payslipId],
    queryFn: () => payslipsApi.get(payslipId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => payslipsApi.remove(payslipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      router.push("/payslips");
    },
  });

  if (!data) return <p className="text-sm text-black/60">Memuat...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">{data.employee?.name}</h1>
      <p className="text-sm text-black/60 mb-6">
        {data.employee?.position} · Periode {data.period}
      </p>

      <table className="w-full text-sm border-collapse mb-4">
        <tbody>
          <tr className="border-b border-black/5 dark:border-white/5">
            <td className="py-2">Gaji Pokok</td>
            <td className="py-2 text-right">{formatCurrency(data.baseSalary)}</td>
          </tr>
          {Object.entries(data.allowances || {}).map(([key, amount]) => (
            <tr key={key} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">Tunjangan · {key}</td>
              <td className="py-2 text-right">+{formatCurrency(amount)}</td>
            </tr>
          ))}
          {Object.entries(data.deductions || {}).map(([key, amount]) => (
            <tr key={key} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">Potongan · {key}</td>
              <td className="py-2 text-right">-{formatCurrency(amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-medium">Total</td>
            <td className="py-2 text-right font-medium">{formatCurrency(data.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-3">
        <a
          href={`/api/payslips/${payslipId}/generate`}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black"
        >
          Download .xlsx
        </a>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="rounded border border-red-600 text-red-600 px-4 py-2 text-sm disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}
