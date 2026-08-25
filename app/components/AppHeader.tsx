"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "./LogoutButton";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/invoices", label: "Invoice" },
  { href: "/payslips", label: "Slip Gaji" },
  { href: "/clients", label: "Client" },
  { href: "/employees", label: "Karyawan" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto max-w-5xl flex items-center gap-6 px-4 py-3 text-sm">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
        <LogoutButton />
      </nav>
    </header>
  );
}
