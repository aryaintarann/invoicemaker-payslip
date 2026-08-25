"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Client, clientsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../../components/PageHeader";
import { DeleteConfirmButton } from "../../components/DeleteConfirmButton";

function ClientForm({ initial }: { initial: Client }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: initial.name,
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
  });

  const updateMutation = useMutation({
    mutationFn: () => clientsApi.update(initial.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Perubahan tersimpan.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.remove(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <Card>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {updateMutation.isError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Warning className="size-4 shrink-0" />
              {(updateMutation.error as Error).message}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
            <DeleteConfirmButton
              variant="full"
              itemLabel={`client "${initial.name}"`}
              pending={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate()}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clientId = Number(id);

  const { data } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => clientsApi.get(clientId),
  });

  return (
    <div className="max-w-lg">
      <PageHeader title="Edit Client" />
      {data ? (
        <ClientForm key={data.id} initial={data} />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
