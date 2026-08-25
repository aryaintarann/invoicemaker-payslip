"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { clientsApi } from "@/lib/api-client";

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const mutation = useMutation({
    mutationFn: () => clientsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
    },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Client Baru</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
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

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50"
        >
          {mutation.isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
