"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IdentificationBadge, MagnifyingGlass, Plus, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { employeesApi } from "@/lib/api-client";
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

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: employeesApi.list,
  });

  const filtered = data?.filter((emp) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.position || "").toLowerCase().includes(q)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Karyawan dihapus.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Karyawan"
        description="Kelola data karyawan dan gaji pokok mereka."
        action={
          <Button nativeButton={false} render={<Link href="/employees/new" />}>
            <Plus className="size-4" />
            Karyawan Baru
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau posisi..."
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
              <TableHead>Nama</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Gaji Pokok</TableHead>
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
            {filtered?.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">
                  <Link href={`/employees/${emp.id}`} className="hover:text-primary hover:underline">
                    {emp.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{emp.position || "-"}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(emp.baseSalary)}</TableCell>
                <TableCell className="text-right">
                  <DeleteConfirmButton
                    itemLabel={`karyawan "${emp.name}"`}
                    onConfirm={() => deleteMutation.mutate(emp.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <IdentificationBadge className="size-8" />
                    <p className="text-sm">
                      {search
                        ? "Tidak ada karyawan yang cocok."
                        : "Belum ada karyawan. Tambahkan karyawan pertama Anda."}
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
