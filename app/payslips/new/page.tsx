"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { payslipsApi } from "@/lib/api-client";
import { emptyPayslipForm, PayslipForm, PayslipFormValues } from "../PayslipForm";
import { PageHeader } from "../../components/PageHeader";

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
      toast.success("Slip gaji baru tersimpan.");
      router.push(`/payslips/${payslip.id}`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Slip Gaji Baru" />
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
