"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api-client";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Client</h1>
        <Link href="/clients/new" className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black">
          + Client Baru
        </Link>
      </div>

      {isLoading && <p className="text-sm text-black/60">Memuat...</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
      {deleteMutation.isError && (
        <p className="text-sm text-red-600 mb-2">{(deleteMutation.error as Error).message}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Telepon</th>
              <th className="py-2 pr-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/clients/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{c.email || "-"}</td>
                <td className="py-2 pr-4">{c.phone || "-"}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-3">
                    <Link href={`/clients/${c.id}`} className="hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus client "${c.name}"?`)) deleteMutation.mutate(c.id);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-black/50">
                  Belum ada client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
