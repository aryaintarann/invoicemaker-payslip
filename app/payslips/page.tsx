"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MagnifyingGlass, Money, PencilSimple, Plus, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { payslipsApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function PayslipsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => payslipsApi.list(),
  });

  const filtered = data?.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.employee?.name || "").toLowerCase().includes(q) ||
      p.period.toLowerCase().includes(q)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => payslipsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Slip gaji dihapus.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Slip Gaji"
        description="Buat dan download slip gaji karyawan tiap periode."
        action={
          <Button nativeButton={false} render={<Link href="/payslips/new" />}>
            <Plus className="size-4" />
            Slip Gaji Baru
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama karyawan atau periode..."
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
              <TableHead>Karyawan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {filtered?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/payslips/${p.id}`} className="hover:text-primary hover:underline">
                    {p.employee?.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.period}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.total)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit slip gaji ${p.employee?.name}`}
                      nativeButton={false}
                      render={<Link href={`/payslips/${p.id}/edit`} />}
                    >
                      <PencilSimple className="size-4" />
                    </Button>
                    <DeleteConfirmButton
                      itemLabel={`slip gaji "${p.employee?.name}" periode ${p.period}`}
                      onConfirm={() => deleteMutation.mutate(p.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Money className="size-8" />
                    <p className="text-sm">
                      {search ? "Tidak ada slip gaji yang cocok." : "Belum ada slip gaji."}
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
