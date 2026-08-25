"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { invoicesApi } from "@/lib/api-client";
import { invoiceHasTax } from "@/lib/invoice-tax";
import { emptyInvoiceForm, InvoiceForm, InvoiceFormValues } from "../InvoiceForm";

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceFormValues>(emptyInvoiceForm);

  const mutation = useMutation({
    mutationFn: () => {
      const hasTax = invoiceHasTax(form.entity, form.kind, form.language);
      return invoicesApi.create({
        ...form,
        contractValue: Number(form.contractValue),
        invoicePercent: Number(form.invoicePercent),
        ppnPercent: hasTax ? Number(form.ppnPercent) : undefined,
        pphPercent: hasTax ? Number(form.pphPercent) : undefined,
        pphDeadline: hasTax ? form.pphDeadline || undefined : undefined,
      });
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push(`/invoices/${invoice.id}`);
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Invoice Baru</h1>
      <InvoiceForm
        form={form}
        setForm={setForm}
        onSubmit={() => mutation.mutate()}
        submitLabel="Simpan"
        pending={mutation.isPending}
        error={mutation.isError ? (mutation.error as Error).message : null}
      />
    </div>
  );
}
