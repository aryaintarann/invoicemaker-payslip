"use client";

import { use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  DownloadSimple,
  PencilSimple,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { InvoiceDocumentType, invoicesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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

const acceptedDocExtensions = ".pdf,.doc,.docx,.xls,.xlsx";

function TaxDocumentRow({
  label,
  invoiceId,
  type,
  fileName,
}: {
  label: string;
  invoiceId: number;
  type: InvoiceDocumentType;
  fileName: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = !!fileName;

  const uploadMutation = useMutation({
    mutationFn: (file: File) => invoicesApi.uploadDocument(invoiceId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      toast.success(`${label} berhasil diupload.`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const removeMutation = useMutation({
    mutationFn: () => invoicesApi.removeDocument(invoiceId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      toast.success(`${label} dihapus.`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge
            variant="outline"
            className={
              hasFile
                ? "bg-success/15 text-success border-transparent dark:text-success"
                : "bg-muted text-muted-foreground border-transparent"
            }
          >
            {hasFile ? "Sudah Ada" : "Belum Ada"}
          </Badge>
        </div>
        {hasFile && <span className="text-xs text-muted-foreground">{fileName}</span>}
      </div>

      <div className="flex items-center gap-1">
        {hasFile ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${label}`}
              nativeButton={false}
              render={<a href={`/api/invoices/${invoiceId}/documents/${type}`} />}
            >
              <DownloadSimple className="size-4" />
            </Button>
            <DeleteConfirmButton
              itemLabel={label}
              pending={removeMutation.isPending}
              onConfirm={() => removeMutation.mutate()}
            />
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={acceptedDocExtensions}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) uploadMutation.mutate(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadMutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <UploadSimple className="size-4" />
              {uploadMutation.isPending ? "Mengupload..." : "Upload"}
            </Button>
          </>
        )}
      </div>
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

      <Card className="mb-6">
        <CardContent className="flex flex-col">
          <TaxDocumentRow
            label="Bukti Potong Pajak"
            invoiceId={invoiceId}
            type="tax-withholding"
            fileName={data.taxWithholdingDocFileName}
          />
          <TaxDocumentRow
            label="Faktur Pajak"
            invoiceId={invoiceId}
            type="tax-invoice"
            fileName={data.taxInvoiceDocFileName}
          />
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
