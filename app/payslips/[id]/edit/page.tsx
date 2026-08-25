"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Payslip, payslipsApi } from "@/lib/api-client";
import { PayslipForm, PayslipFormValues } from "../../PayslipForm";
import { PageHeader } from "../../../components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      toast.success("Perubahan tersimpan.");
      router.push(`/payslips/${payslip.id}`);
    },
    onError: (err) => toast.error((err as Error).message),
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
      <PageHeader title="Edit Slip Gaji" />
      {!data ? (
        <Card>
          <CardContent className="flex flex-col gap-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : (
        <EditForm key={data.id} payslip={data} />
      )}
    </div>
  );
}
