import Link from "next/link";
import { ArrowRight, FileText, IdentificationBadge, Money, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "./components/PageHeader";

const cards = [
  {
    href: "/invoices",
    title: "Invoice",
    desc: "Buat, kelola, dan download invoice untuk klien.",
    icon: FileText,
  },
  {
    href: "/payslips",
    title: "Slip Gaji",
    desc: "Buat dan download slip gaji karyawan tiap periode.",
    icon: Money,
  },
  {
    href: "/clients",
    title: "Client",
    desc: "Kelola data client dan informasi kontaknya.",
    icon: UsersThree,
  },
  {
    href: "/employees",
    title: "Karyawan",
    desc: "Kelola data karyawan dan gaji pokok mereka.",
    icon: IdentificationBadge,
  },
] as const;

export default function HomePage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Pilih menu di bawah untuk mulai bekerja."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.title}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
