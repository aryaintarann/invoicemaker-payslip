"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { employeesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

export default function EmployeesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: employeesApi.list,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Karyawan</h1>
        <Link href="/employees/new" className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black">
          + Karyawan Baru
        </Link>
      </div>

      {isLoading && <p className="text-sm text-black/60">Memuat...</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Posisi</th>
              <th className="py-2 pr-4">Gaji Pokok</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((emp) => (
              <tr key={emp.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/employees/${emp.id}`} className="hover:underline">
                    {emp.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{emp.position || "-"}</td>
                <td className="py-2 pr-4">{formatCurrency(emp.baseSalary)}</td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-black/50">
                  Belum ada karyawan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
