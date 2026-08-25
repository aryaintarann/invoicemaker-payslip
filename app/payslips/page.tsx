"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { payslipsApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

export default function PayslipsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => payslipsApi.list(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Slip Gaji</h1>
        <Link href="/payslips/new" className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black">
          + Slip Gaji Baru
        </Link>
      </div>

      {isLoading && <p className="text-sm text-black/60">Memuat...</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Karyawan</th>
              <th className="py-2 pr-4">Periode</th>
              <th className="py-2 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/payslips/${p.id}`} className="hover:underline">
                    {p.employee?.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{p.period}</td>
                <td className="py-2 pr-4">{formatCurrency(p.total)}</td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-black/50">
                  Belum ada slip gaji.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
