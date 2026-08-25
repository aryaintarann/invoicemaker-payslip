"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadSimple, PencilSimple } from "@phosphor-icons/react";

import { payslipsApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../../components/PageHeader";
import { DeleteConfirmButton } from "../../components/DeleteConfirmButton";

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-border py-2.5 last:border-0 ${strong ? "font-medium" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const payslipId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["payslips", payslipId],
    queryFn: () => payslipsApi.get(payslipId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => payslipsApi.remove(payslipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      router.push("/payslips");
    },
  });

  if (!data) {
    return (
      <div className="max-w-xl">
        <PageHeader title="Slip Gaji" />
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-4 h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const transportTotal = Number(data.uangTransportMakanPerHari) * data.jumlahHariKerja;
  const totalPendapatan = Number(data.gajiPokok) + transportTotal + Number(data.biayaBpjs);

  return (
    <div className="max-w-xl">
      <PageHeader
        title={data.employee?.name ?? "-"}
        description={`${data.employee?.position ?? "-"} · Periode ${data.period} · ${data.jumlahHariKerja} hari kerja`}
      />

      <Card className="mb-6">
        <CardContent>
          <Row label="Gaji Pokok" value={formatCurrency(data.gajiPokok)} />
          <Row
            label={`Transport + Makan (${formatCurrency(data.uangTransportMakanPerHari)} × ${data.jumlahHariKerja})`}
            value={`+${formatCurrency(transportTotal)}`}
          />
          <Row label="Tambahan BPJS Tenagakerja" value={`+${formatCurrency(data.biayaBpjs)}`} />
          <Row label="Total Pendapatan" value={formatCurrency(totalPendapatan)} strong />
          <Row label="Potongan BPJS JHT" value={`-${formatCurrency(data.biayaBpjsJht)}`} />
          <Row label="Total Gaji" value={formatCurrency(data.total)} strong />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<a href={`/api/payslips/${payslipId}/generate`} />}>
          <DownloadSimple className="size-4" />
          Download .xlsx
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/payslips/${payslipId}/edit`} />}>
          <PencilSimple className="size-4" />
          Edit
        </Button>
        <DeleteConfirmButton
          variant="full"
          itemLabel={`slip gaji "${data.employee?.name}" periode ${data.period}`}
          pending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>
    </div>
  );
}
