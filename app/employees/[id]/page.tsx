"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Employee, employeesApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../../components/PageHeader";
import { DeleteConfirmButton } from "../../components/DeleteConfirmButton";

function EmployeeForm({ initial }: { initial: Employee }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: initial.name,
    position: initial.position ?? "",
    baseSalary: initial.baseSalary,
  });

  const updateMutation = useMutation({
    mutationFn: () => employeesApi.update(initial.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Perubahan tersimpan.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => employeesApi.remove(initial.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
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
            <Label htmlFor="position">Posisi</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="baseSalary">Gaji Pokok</Label>
            <Input
              id="baseSalary"
              type="number"
              required
              min={0}
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
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
              itemLabel={`karyawan "${initial.name}"`}
              pending={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate()}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);

  const { data } = useQuery({
    queryKey: ["employees", employeeId],
    queryFn: () => employeesApi.get(employeeId),
  });

  return (
    <div className="max-w-lg">
      <PageHeader title="Edit Karyawan" />
      {data ? (
        <EmployeeForm key={data.id} initial={data} />
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
