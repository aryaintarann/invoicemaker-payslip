"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { employeesApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../../components/PageHeader";

export default function NewEmployeePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", position: "", baseSalary: "" });

  const mutation = useMutation({
    mutationFn: () => employeesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Karyawan baru tersimpan.");
      router.push("/employees");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="max-w-lg">
      <PageHeader title="Karyawan Baru" description="Tambahkan data karyawan untuk digunakan pada slip gaji." />
      <Card>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
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

            {mutation.isError && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <Warning className="size-4 shrink-0" />
                {(mutation.error as Error).message}
              </p>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-fit">
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
