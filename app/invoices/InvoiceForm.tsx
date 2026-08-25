"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Info, Warning } from "@phosphor-icons/react";

import { clientsApi } from "@/lib/api-client";
import { invoiceHasTax } from "@/lib/invoice-tax";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "../components/NativeSelect";

export type InvoiceFormValues = {
  clientId: string;
  invoiceNumber: string;
  entity: "cv" | "op";
  kind: "dp" | "termin1" | "termin2" | "final";
  language: "id" | "en";
  invoiceLabel: string;
  clientAttn: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  contractValue: string;
  invoicePercent: string;
  ppnPercent: string;
  pphPercent: string;
  pphDeadline: string;
};

export const emptyInvoiceForm: InvoiceFormValues = {
  clientId: "",
  invoiceNumber: "",
  entity: "op",
  kind: "final",
  language: "id",
  invoiceLabel: "Final",
  clientAttn: "",
  projectName: "",
  issueDate: "",
  dueDate: "",
  status: "draft",
  contractValue: "",
  invoicePercent: "100",
  ppnPercent: "11",
  pphPercent: "6",
  pphDeadline: "",
};

const kindDefaultLabel: Record<string, string> = {
  dp: "DP (Down Payment)",
  termin1: "Termin I",
  termin2: "Termin II",
  final: "Final",
};

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function InvoiceForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  pending,
  error,
}: {
  form: InvoiceFormValues;
  setForm: (form: InvoiceFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  error?: string | null;
}) {
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const hasTax = invoiceHasTax(form.entity, form.kind, form.language);

  const preview = useMemo(() => {
    const contractValue = Number(form.contractValue || 0);
    const percent = Number(form.invoicePercent || 0);
    const billed = (contractValue * percent) / 100;
    const remaining = contractValue - billed;
    if (!hasTax) {
      return { billed, remaining, ppn: 0, pph: 0, total: billed };
    }
    const ppn = (billed * Number(form.ppnPercent || 0)) / 100;
    const pph = (billed * Number(form.pphPercent || 0)) / 100;
    return { billed, remaining, ppn, pph, total: billed + ppn - pph };
  }, [form, hasTax]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Card>
        <CardContent className="flex flex-col gap-5">
          <Field label="Client" htmlFor="clientId">
            <NativeSelect
              id="clientId"
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">Pilih client</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label='Nama Kontak (opsional, mis. "Bapak Wiwin")' htmlFor="clientAttn">
            <Input
              id="clientAttn"
              value={form.clientAttn}
              onChange={(e) => setForm({ ...form, clientAttn: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Entity" htmlFor="entity">
              <NativeSelect
                id="entity"
                value={form.entity}
                onChange={(e) => setForm({ ...form, entity: e.target.value as "cv" | "op" })}
              >
                <option value="op">OP (Individu, tanpa PPN/PPh)</option>
                <option value="cv">CV (dengan PPN/PPh)</option>
              </NativeSelect>
            </Field>
            <Field label="Jenis" htmlFor="kind">
              <NativeSelect
                id="kind"
                value={form.kind}
                onChange={(e) => {
                  const kind = e.target.value as "dp" | "termin1" | "termin2" | "final";
                  setForm({ ...form, kind, invoiceLabel: kindDefaultLabel[kind] });
                }}
              >
                <option value="dp">DP (Down Payment)</option>
                <option value="termin1">Termin I</option>
                <option value="termin2">Termin II</option>
                <option value="final">Final</option>
              </NativeSelect>
            </Field>
            <Field label="Bahasa" htmlFor="language">
              <NativeSelect
                id="language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as "id" | "en" })}
              >
                <option value="id">Indonesia</option>
                <option value="en">Inggris</option>
              </NativeSelect>
            </Field>
          </div>
          {form.entity === "op" && form.kind === "final" && form.language === "en" && (
            <p className="-mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Template OP Final versi Inggris tetap menyertakan PPN/PPh, berbeda dari OP lainnya.
            </p>
          )}

          <Field label='Label Invoice (teks yang tercetak, mis. "1st DP", "50% DP (Down Payment)", "Final")' htmlFor="invoiceLabel">
            <Input
              id="invoiceLabel"
              required
              value={form.invoiceLabel}
              onChange={(e) => setForm({ ...form, invoiceLabel: e.target.value })}
            />
          </Field>

          <Field label="Nama Proyek" htmlFor="projectName">
            <Input
              id="projectName"
              required
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={form.entity === "op" ? "No. Invoice (opsional untuk OP)" : "No. Invoice"}
              htmlFor="invoiceNumber"
            >
              <Input
                id="invoiceNumber"
                required={form.entity !== "op"}
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <NativeSelect
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as "draft" | "sent" | "paid" | "overdue",
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="sent">Terkirim</option>
                <option value="paid">Lunas</option>
                <option value="overdue">Jatuh Tempo</option>
              </NativeSelect>
            </Field>
            <Field label="Tanggal Terbit" htmlFor="issueDate">
              <Input
                id="issueDate"
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </Field>
            <Field label="Jatuh Tempo" htmlFor="dueDate">
              <Input
                id="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nilai Kontrak (Rp)" htmlFor="contractValue">
              <Input
                id="contractValue"
                type="number"
                required
                min={0}
                value={form.contractValue}
                onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
              />
            </Field>
            <Field label="Persen Tagihan Ini (%)" htmlFor="invoicePercent">
              <Input
                id="invoicePercent"
                type="number"
                required
                min={0.01}
                max={100}
                step="any"
                value={form.invoicePercent}
                onChange={(e) => setForm({ ...form, invoicePercent: e.target.value })}
              />
            </Field>
          </div>

          {hasTax && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="PPN (%)" htmlFor="ppnPercent">
                <Input
                  id="ppnPercent"
                  type="number"
                  min={0}
                  step="any"
                  value={form.ppnPercent}
                  onChange={(e) => setForm({ ...form, ppnPercent: e.target.value })}
                />
              </Field>
              <Field label="PPh (%)" htmlFor="pphPercent">
                <Input
                  id="pphPercent"
                  type="number"
                  min={0}
                  step="any"
                  value={form.pphPercent}
                  onChange={(e) => setForm({ ...form, pphPercent: e.target.value })}
                />
              </Field>
              <Field label="Batas Kirim Bukti Potong" htmlFor="pphDeadline">
                <Input
                  id="pphDeadline"
                  type="date"
                  value={form.pphDeadline}
                  onChange={(e) => setForm({ ...form, pphDeadline: e.target.value })}
                />
              </Field>
            </div>
          )}

          <div className="rounded-lg bg-muted/60 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Jumlah Tagihan</span>
              <span className="tabular-nums">{preview.billed.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Sisa</span>
              <span className="tabular-nums">{preview.remaining.toLocaleString("id-ID")}</span>
            </div>
            {hasTax && (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">PPN</span>
                  <span className="tabular-nums">{preview.ppn.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">PPh</span>
                  <span className="tabular-nums">-{preview.pph.toLocaleString("id-ID")}</span>
                </div>
              </>
            )}
            <div className="mt-1 flex justify-between border-t border-border pt-2 font-medium">
              <span>Total Tagihan</span>
              <span className="tabular-nums">{preview.total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}
