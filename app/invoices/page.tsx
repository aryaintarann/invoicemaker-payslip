"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MagnifyingGlass, PencilSimple, Plus, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { invoicesApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "../components/PageHeader";
import { DeleteConfirmButton } from "../components/DeleteConfirmButton";
import { StatusBadge } from "../components/StatusBadge";

const statuses = ["", "draft", "sent", "paid", "overdue"] as const;

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

export default function InvoicesPage() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", status],
    queryFn: () => invoicesApi.list(status || undefined),
  });

  const filtered = data?.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.client?.name || "").toLowerCase().includes(q) ||
      inv.projectName.toLowerCase().includes(q)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice dihapus.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Invoice"
        description="Buat, kelola, dan download invoice untuk klien."
        action={
          <Button nativeButton={false} render={<Link href="/invoices/new" />}>
            <Plus className="size-4" />
            Invoice Baru
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s ? statusLabel[s] : "Semua"}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari no. invoice, client, atau proyek..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-1.5 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {(error as Error).message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>No. Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Proyek</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {filtered?.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <Link href={`/invoices/${inv.id}`} className="hover:text-primary hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{inv.client?.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {inv.projectName} &middot; {inv.entity.toUpperCase()} &middot; {inv.invoiceLabel}
                </TableCell>
                <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(inv.total)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit invoice ${inv.invoiceNumber}`}
                      nativeButton={false}
                      render={<Link href={`/invoices/${inv.id}/edit`} />}
                    >
                      <PencilSimple className="size-4" />
                    </Button>
                    <DeleteConfirmButton
                      itemLabel={`invoice "${inv.invoiceNumber}"`}
                      onConfirm={() => deleteMutation.mutate(inv.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="size-8" />
                    <p className="text-sm">
                      {search ? "Tidak ada invoice yang cocok." : "Belum ada invoice."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
