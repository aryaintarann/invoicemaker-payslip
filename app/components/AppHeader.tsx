"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  IdentificationBadge,
  Money,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

const navLinks = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/payslips", label: "Slip Gaji", icon: Money },
  { href: "/clients", label: "Client", icon: UsersThree },
  { href: "/employees", label: "Karyawan", icon: IdentificationBadge },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 shrink-0 text-sm font-semibold tracking-tight">
          Invoice<span className="text-primary">&</span>Slip
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" weight={active ? "fill" : "regular"} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
