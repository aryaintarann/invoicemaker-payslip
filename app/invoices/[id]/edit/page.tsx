"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Invoice, invoicesApi } from "@/lib/api-client";
import { InvoiceForm, InvoiceFormValues } from "../../InvoiceForm";

function toFormValues(invoice: Invoice): InvoiceFormValues {
  return {
    clientId: String(invoice.clientId),
    invoiceNumber: invoice.invoiceNumber,
    entity: invoice.entity,
    kind: invoice.kind,
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
    mutationFn: () =>
      invoicesApi.update(invoice.id, {
        ...form,
        clientId: Number(form.clientId),
        contractValue: Number(form.contractValue),
        invoicePercent: Number(form.invoicePercent),
        ppnPercent: form.entity === "cv" ? Number(form.ppnPercent) : undefined,
        pphPercent: form.entity === "cv" ? Number(form.pphPercent) : undefined,
        pphDeadline: form.entity === "cv" ? form.pphDeadline || undefined : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push(`/invoices/${invoice.id}`);
    },
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
      <h1 className="text-2xl font-semibold mb-6">Edit Invoice</h1>
      {!data ? (
        <p className="text-sm text-black/60">Memuat...</p>
      ) : (
        <EditForm key={data.id} invoice={data} />
      )}
    </div>
  );
}
