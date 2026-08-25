"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, DownloadSimple, PencilSimple, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { invoicesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { DeleteConfirmButton } from "../../components/DeleteConfirmButton";

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-border py-2.5 last:border-0 ${strong ? "font-medium" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => invoicesApi.get(invoiceId),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => invoicesApi.markPaid(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      toast.success("Invoice ditandai lunas.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.remove(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push("/invoices");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (!data) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Invoice" />
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

  const canMarkPaid = data.status === "sent" || data.status === "overdue";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={data.invoiceNumber}
        description={`${data.client?.name} · ${data.entity.toUpperCase()} · ${data.invoiceLabel} · ${data.projectName}`}
        action={<StatusBadge status={data.status} />}
      />
      <p className="-mt-6 mb-6 text-sm text-muted-foreground">
        Terbit {data.issueDate} &middot; Jatuh tempo {data.dueDate}
      </p>

      <Card className="mb-6">
        <CardContent>
          <Row label="Nilai Kontrak" value={formatCurrency(data.contractValue)} />
          <Row label={`Persen Tagihan (${data.invoicePercent}%)`} value={formatCurrency(data.billedAmount)} />
          <Row label="Sisa" value={formatCurrency(data.remainingAmount)} />
          {data.entity === "cv" && (
            <>
              <Row label={`PPN (${data.ppnPercent}%)`} value={`+${formatCurrency(data.ppnAmount ?? "0")}`} />
              <Row label={`PPh (${data.pphPercent}%)`} value={`-${formatCurrency(data.pphAmount ?? "0")}`} />
            </>
          )}
          <Row label="Total Tagihan" value={formatCurrency(data.total)} strong />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<a href={`/api/invoices/${invoiceId}/generate`} />}>
          <DownloadSimple className="size-4" />
          Download .docx
        </Button>
        {canMarkPaid && (
          <Button
            variant="outline"
            onClick={() => markPaidMutation.mutate()}
            disabled={markPaidMutation.isPending}
          >
            <CheckCircle className="size-4" />
            Tandai Lunas
          </Button>
        )}
        <Button variant="outline" nativeButton={false} render={<Link href={`/invoices/${invoiceId}/edit`} />}>
          <PencilSimple className="size-4" />
          Edit
        </Button>
        <DeleteConfirmButton
          variant="full"
          itemLabel={`invoice "${data.invoiceNumber}"`}
          pending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>

      {markPaidMutation.isError && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {(markPaidMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
