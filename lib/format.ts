export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string, language: "id" | "en" = "id"): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}
