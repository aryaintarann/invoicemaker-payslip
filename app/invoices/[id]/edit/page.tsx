"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Invoice, invoicesApi } from "@/lib/api-client";
import { invoiceHasTax } from "@/lib/invoice-tax";
import { InvoiceForm, InvoiceFormValues } from "../../InvoiceForm";
import { PageHeader } from "../../../components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function toFormValues(invoice: Invoice): InvoiceFormValues {
  return {
    clientId: String(invoice.clientId),
    invoiceNumber: invoice.invoiceNumber ?? "",
    entity: invoice.entity,
    kind: invoice.kind,
    language: invoice.language,
    invoiceLabel: invoice.invoiceLabel,
    clientAttn: invoice.clientAttn ?? "",
    projectName: invoice.projectName,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    contractValue: invoice.contractValue,
    invoicePercent: invoice.invoicePercent,
    ppnPercent: invoice.ppnPercent ?? "11",
    pphPercent: invoice.pphPercent ?? "6",
    pphDeadline: invoice.pphDeadline ?? "",
  };
}

function EditForm({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceFormValues>(() => toFormValues(invoice));

  const mutation = useMutation({
    mutationFn: () => {
      const hasTax = invoiceHasTax(form.entity, form.kind, form.language);
      return invoicesApi.update(invoice.id, {
        ...form,
        clientId: Number(form.clientId),
        contractValue: Number(form.contractValue),
        invoicePercent: Number(form.invoicePercent),
        ppnPercent: hasTax ? Number(form.ppnPercent) : undefined,
        pphPercent: hasTax ? Number(form.pphPercent) : undefined,
        pphDeadline: hasTax ? form.pphDeadline || undefined : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Perubahan tersimpan.");
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <InvoiceForm
      form={form}
      setForm={setForm}
      onSubmit={() => mutation.mutate()}
      submitLabel="Simpan Perubahan"
      pending={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
    />
  );
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = Number(id);

  const { data } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => invoicesApi.get(invoiceId),
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Invoice" />
      {!data ? (
        <Card>
          <CardContent className="flex flex-col gap-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : (
        <EditForm key={data.id} invoice={data} />
      )}
    </div>
  );
}
