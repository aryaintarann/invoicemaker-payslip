"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MagnifyingGlass, PencilSimple, Plus, UsersThree, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { clientsApi } from "@/lib/api-client";
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

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const filtered = data?.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client dihapus.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Client"
        description="Kelola data client dan informasi kontaknya."
        action={
          <Button nativeButton={false} render={<Link href="/clients/new" />}>
            <Plus className="size-4" />
            Client Baru
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama, email, atau telepon..."
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
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
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
            {filtered?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${c.id}`} className="hover:text-primary hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.email || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit client ${c.name}`}
                      nativeButton={false}
                      render={<Link href={`/clients/${c.id}`} />}
                    >
                      <PencilSimple className="size-4" />
                    </Button>
                    <DeleteConfirmButton
                      itemLabel={`client "${c.name}"`}
                      onConfirm={() => deleteMutation.mutate(c.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UsersThree className="size-8" />
                    <p className="text-sm">
                      {search
                        ? "Tidak ada client yang cocok."
                        : "Belum ada client. Tambahkan client pertama Anda."}
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
