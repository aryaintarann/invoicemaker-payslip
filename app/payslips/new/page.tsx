"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { payslipsApi } from "@/lib/api-client";
import { emptyPayslipForm, PayslipForm, PayslipFormValues } from "../PayslipForm";

export default function NewPayslipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PayslipFormValues>(emptyPayslipForm);

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
      <PayslipForm
        form={form}
        setForm={setForm}
        onSubmit={() => mutation.mutate()}
        submitLabel="Simpan"
        pending={mutation.isPending}
        error={mutation.isError ? (mutation.error as Error).message : null}
      />
    </div>
  );
}
