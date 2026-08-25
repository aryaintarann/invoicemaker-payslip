"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Employee, employeesApi } from "@/lib/api-client";

function EmployeeForm({ initial }: { initial: Employee }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: initial.name,
    position: initial.position ?? "",
    baseSalary: initial.baseSalary,
  });

  const updateMutation = useMutation({
    mutationFn: () => employeesApi.update(initial.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => employeesApi.remove(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
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

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);

  const { data } = useQuery({
    queryKey: ["employees", employeeId],
    queryFn: () => employeesApi.get(employeeId),
  });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Edit Karyawan</h1>
      {data ? <EmployeeForm key={data.id} initial={data} /> : <p className="text-sm text-black/60">Memuat...</p>}
    </div>
  );
}
