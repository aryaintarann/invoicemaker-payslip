"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Warning } from "@phosphor-icons/react";

import { employeesApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "../components/NativeSelect";

export type PayslipFormValues = {
  employeeId: string;
  period: string;
  issueDate: string;
  jumlahHariKerja: string;
  gajiPokok: string;
  uangTransportMakanPerHari: string;
  biayaBpjs: string;
  biayaBpjsJht: string;
};

export const emptyPayslipForm: PayslipFormValues = {
  employeeId: "",
  period: "",
  issueDate: "",
  jumlahHariKerja: "",
  gajiPokok: "",
  uangTransportMakanPerHari: "",
  biayaBpjs: "0",
  biayaBpjsJht: "0",
};

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function PayslipForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  pending,
  error,
}: {
  form: PayslipFormValues;
  setForm: (form: PayslipFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  error?: string | null;
}) {
  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: employeesApi.list });

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

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Card>
        <CardContent className="flex flex-col gap-5">
          <Field label="Karyawan" htmlFor="employeeId">
            <NativeSelect
              id="employeeId"
              required
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
            </NativeSelect>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Periode (YYYY-MM)" htmlFor="period">
              <Input
                id="period"
                required
                placeholder="2026-08"
                pattern="\d{4}-\d{2}"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
              />
            </Field>
            <Field label="Tanggal Slip" htmlFor="issueDate">
              <Input
                id="issueDate"
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </Field>
            <Field label="Jumlah Hari Kerja" htmlFor="jumlahHariKerja">
              <Input
                id="jumlahHariKerja"
                type="number"
                required
                min={0}
                value={form.jumlahHariKerja}
                onChange={(e) => setForm({ ...form, jumlahHariKerja: e.target.value })}
              />
            </Field>
            <Field label="Gaji Pokok" htmlFor="gajiPokok">
              <Input
                id="gajiPokok"
                type="number"
                required
                min={0}
                value={form.gajiPokok}
                onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })}
              />
            </Field>
            <Field label="Uang Transport + Makan (per hari)" htmlFor="uangTransportMakanPerHari">
              <Input
                id="uangTransportMakanPerHari"
                type="number"
                required
                min={0}
                value={form.uangTransportMakanPerHari}
                onChange={(e) => setForm({ ...form, uangTransportMakanPerHari: e.target.value })}
              />
            </Field>
            <Field label="Tambahan BPJS Tenagakerja" htmlFor="biayaBpjs">
              <Input
                id="biayaBpjs"
                type="number"
                min={0}
                value={form.biayaBpjs}
                onChange={(e) => setForm({ ...form, biayaBpjs: e.target.value })}
              />
            </Field>
            <Field label="Potongan BPJS JHT" htmlFor="biayaBpjsJht">
              <Input
                id="biayaBpjsJht"
                type="number"
                min={0}
                value={form.biayaBpjsJht}
                onChange={(e) => setForm({ ...form, biayaBpjsJht: e.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-lg bg-muted/60 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Transport + Makan ({form.jumlahHariKerja || 0} hari)</span>
              <span className="tabular-nums">{preview.transportTotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Total Pendapatan</span>
              <span className="tabular-nums">{preview.totalPendapatan.toLocaleString("id-ID")}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-2 font-medium">
              <span>Total Gaji</span>
              <span className="tabular-nums">{preview.total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}
