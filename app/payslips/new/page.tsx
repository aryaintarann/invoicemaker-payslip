"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { employeesApi, payslipsApi } from "@/lib/api-client";

type ComponentForm = { key: string; amount: string };

export default function NewPayslipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: employeesApi.list });

  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [allowances, setAllowances] = useState<ComponentForm[]>([]);
  const [deductions, setDeductions] = useState<ComponentForm[]>([]);

  function toRecord(list: ComponentForm[]) {
    return Object.fromEntries(list.filter((c) => c.key).map((c) => [c.key, Number(c.amount || 0)]));
  }

  const mutation = useMutation({
    mutationFn: () =>
      payslipsApi.create({
        employeeId,
        period,
        baseSalary,
        allowances: toRecord(allowances),
        deductions: toRecord(deductions),
      }),
    onSuccess: (payslip) => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      router.push(`/payslips/${payslip.id}`);
    },
  });

  function componentEditor(
    label: string,
    list: ComponentForm[],
    setList: (v: ComponentForm[]) => void
  ) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
          <button
            type="button"
            onClick={() => setList([...list, { key: "", amount: "0" }])}
            className="text-xs underline"
          >
            + Tambah
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {list.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_28px] gap-2">
              <input
                placeholder="nama (mis. transport)"
                className="border border-black/20 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                value={c.key}
                onChange={(e) =>
                  setList(list.map((it, idx) => (idx === i ? { ...it, key: e.target.value } : it)))
                }
              />
              <input
                type="number"
                placeholder="jumlah"
                min={0}
                className="border border-black/20 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                value={c.amount}
                onChange={(e) =>
                  setList(list.map((it, idx) => (idx === i ? { ...it, amount: e.target.value } : it)))
                }
              />
              <button
                type="button"
                onClick={() => setList(list.filter((_, idx) => idx !== i))}
                className="text-red-600 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Slip Gaji Baru</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Karyawan
          <select
            required
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              const emp = employees?.find((x) => String(x.id) === e.target.value);
              if (emp) setBaseSalary(emp.baseSalary);
            }}
          >
            <option value="">Pilih karyawan</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Periode (YYYY-MM)
            <input
              required
              placeholder="2026-08"
              pattern="\d{4}-\d{2}"
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Gaji Pokok
            <input
              type="number"
              required
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
          </label>
        </div>

        {componentEditor("Tunjangan", allowances, setAllowances)}
        {componentEditor("Potongan", deductions, setDeductions)}

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50 w-fit"
        >
          {mutation.isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
