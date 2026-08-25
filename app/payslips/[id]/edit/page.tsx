"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Payslip, payslipsApi } from "@/lib/api-client";
import { PayslipForm, PayslipFormValues } from "../../PayslipForm";

function toFormValues(payslip: Payslip): PayslipFormValues {
  return {
    employeeId: String(payslip.employeeId),
    period: payslip.period,
    issueDate: payslip.issueDate,
    jumlahHariKerja: String(payslip.jumlahHariKerja),
    gajiPokok: payslip.gajiPokok,
    uangTransportMakanPerHari: payslip.uangTransportMakanPerHari,
    biayaBpjs: payslip.biayaBpjs,
    biayaBpjsJht: payslip.biayaBpjsJht,
  };
}

function EditForm({ payslip }: { payslip: Payslip }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PayslipFormValues>(() => toFormValues(payslip));

  const mutation = useMutation({
    mutationFn: () =>
      payslipsApi.update(payslip.id, {
        ...form,
        employeeId: Number(form.employeeId),
        jumlahHariKerja: Number(form.jumlahHariKerja),
        gajiPokok: Number(form.gajiPokok),
        uangTransportMakanPerHari: Number(form.uangTransportMakanPerHari),
        biayaBpjs: Number(form.biayaBpjs),
        biayaBpjsJht: Number(form.biayaBpjsJht),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      router.push(`/payslips/${payslip.id}`);
    },
  });

  return (
    <PayslipForm
      form={form}
      setForm={setForm}
      onSubmit={() => mutation.mutate()}
      submitLabel="Simpan Perubahan"
      pending={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
    />
  );
}

export default function EditPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const payslipId = Number(id);

  const { data } = useQuery({
    queryKey: ["payslips", payslipId],
    queryFn: () => payslipsApi.get(payslipId),
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Slip Gaji</h1>
      {!data ? (
        <p className="text-sm text-black/60">Memuat...</p>
      ) : (
        <EditForm key={data.id} payslip={data} />
      )}
    </div>
  );
}
