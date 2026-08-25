"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UsersThree, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { clientsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
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
            {data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${c.id}`} className="hover:text-primary hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.email || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                <TableCell className="text-right">
                  <DeleteConfirmButton
                    itemLabel={`client "${c.name}"`}
                    onConfirm={() => deleteMutation.mutate(c.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UsersThree className="size-8" />
                    <p className="text-sm">Belum ada client. Tambahkan client pertama Anda.</p>
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
