"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Client, clientsApi } from "@/lib/api-client";

function ClientForm({ initial }: { initial: Client }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: initial.name,
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
  });

  const updateMutation = useMutation({
    mutationFn: () => clientsApi.update(initial.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.remove(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        updateMutation.mutate();
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Nama
        <input
          required
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Telepon
        <input
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Alamat
        <textarea
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50"
        >
          {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="rounded border border-red-600 text-red-600 px-4 py-2 text-sm disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clientId = Number(id);

  const { data } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => clientsApi.get(clientId),
  });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Edit Client</h1>
      {data ? <ClientForm key={data.id} initial={data} /> : <p className="text-sm text-black/60">Memuat...</p>}
    </div>
  );
}
