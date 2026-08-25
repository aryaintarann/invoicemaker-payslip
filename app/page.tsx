import Link from "next/link";

const cards = [
  { href: "/invoices", title: "Invoice", desc: "Buat, kelola, dan download invoice." },
  { href: "/payslips", title: "Slip Gaji", desc: "Buat dan download slip gaji karyawan." },
  { href: "/clients", title: "Client", desc: "Kelola data client." },
  { href: "/employees", title: "Karyawan", desc: "Kelola data karyawan." },
] as const;

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Invoice & Slip Gaji</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-black/10 dark:border-white/10 p-5 hover:bg-black/[.03] dark:hover:bg-white/[.03] transition-colors"
          >
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-black/60 dark:text-white/60">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
