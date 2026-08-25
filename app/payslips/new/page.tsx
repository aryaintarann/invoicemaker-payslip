"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { employeesApi, payslipsApi } from "@/lib/api-client";

export default function NewPayslipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: employeesApi.list });

  const [form, setForm] = useState({
    employeeId: "",
    period: "",
    issueDate: "",
    jumlahHariKerja: "",
    gajiPokok: "",
    uangTransportMakanPerHari: "",
    biayaBpjs: "0",
    biayaBpjsJht: "0",
  });

  const preview = useMemo(() => {
    const gajiPokok = Number(form.gajiPokok || 0);
    const hariKerja = Number(form.jumlahHariKerja || 0);
    const transportPerHari = Number(form.uangTransportMakanPerHari || 0);
    const biayaBpjs = Number(form.biayaBpjs || 0);
    const biayaBpjsJht = Number(form.biayaBpjsJht || 0);
    const transportTotal = transportPerHari * hariKerja;
    const totalPendapatan = gajiPokok + transportTotal + biayaBpjs;
    const total = totalPendapatan - biayaBpjsJht;
    return { transportTotal, totalPendapatan, total };
  }, [form]);

  const mutation = useMutation({
    mutationFn: () =>
      payslipsApi.create({
        ...form,
        jumlahHariKerja: Number(form.jumlahHariKerja),
        gajiPokok: Number(form.gajiPokok),
        uangTransportMakanPerHari: Number(form.uangTransportMakanPerHari),
        biayaBpjs: Number(form.biayaBpjs),
        biayaBpjsJht: Number(form.biayaBpjsJht),
      }),
    onSuccess: (payslip) => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      router.push(`/payslips/${payslip.id}`);
    },
  });

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
            value={form.employeeId}
            onChange={(e) => {
              const employeeId = e.target.value;
              const emp = employees?.find((x) => String(x.id) === employeeId);
              setForm({
                ...form,
                employeeId,
                gajiPokok: emp ? emp.baseSalary : form.gajiPokok,
              });
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
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tanggal Slip
            <input
              type="date"
              required
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Jumlah Hari Kerja
            <input
              type="number"
              required
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.jumlahHariKerja}
              onChange={(e) => setForm({ ...form, jumlahHariKerja: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Gaji Pokok
            <input
              type="number"
              required
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.gajiPokok}
              onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Uang Transport + Makan (per hari)
            <input
              type="number"
              required
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.uangTransportMakanPerHari}
              onChange={(e) => setForm({ ...form, uangTransportMakanPerHari: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tambahan BPJS Tenagakerja
            <input
              type="number"
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.biayaBpjs}
              onChange={(e) => setForm({ ...form, biayaBpjs: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Potongan BPJS JHT
            <input
              type="number"
              min={0}
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              value={form.biayaBpjsJht}
              onChange={(e) => setForm({ ...form, biayaBpjsJht: e.target.value })}
            />
          </label>
        </div>

        <div className="rounded border border-black/10 dark:border-white/10 p-4 text-sm flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Transport + Makan ({form.jumlahHariKerja || 0} hari)</span>
            <span>{preview.transportTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pendapatan</span>
            <span>{preview.totalPendapatan.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Gaji</span>
            <span>{preview.total.toLocaleString("id-ID")}</span>
          </div>
        </div>

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
