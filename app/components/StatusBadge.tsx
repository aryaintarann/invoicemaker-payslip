import { Badge } from "@/components/ui/badge";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

const statusClass: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  sent: "bg-accent text-accent-foreground border-transparent",
  paid: "bg-success/15 text-success border-transparent dark:text-success",
  overdue: "bg-destructive/10 text-destructive border-transparent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={statusClass[status] ?? ""} variant="outline">
      {statusLabel[status] ?? status}
    </Badge>
  );
}
