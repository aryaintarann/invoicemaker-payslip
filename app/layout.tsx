import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "./providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice & Slip Gaji",
  description: "Aplikasi pribadi untuk membuat invoice dan slip gaji",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/invoices", label: "Invoice" },
  { href: "/payslips", label: "Slip Gaji" },
  { href: "/clients", label: "Client" },
  { href: "/employees", label: "Karyawan" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <header className="border-b border-black/10 dark:border-white/10">
            <nav className="mx-auto max-w-5xl flex items-center gap-6 px-4 py-3 text-sm">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
