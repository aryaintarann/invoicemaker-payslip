"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { employeesApi } from "@/lib/api-client";

export default function NewEmployeePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", position: "", baseSalary: "" });

  const mutation = useMutation({
    mutationFn: () => employeesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
    },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Karyawan Baru</h1>
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
          Posisi
          <input
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gaji Pokok
          <input
            type="number"
            required
            min={0}
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={form.baseSalary}
            onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
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
