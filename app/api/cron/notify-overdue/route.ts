import { and, eq, inArray, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceFollowups, invoices } from "@/db/schema";
import { sendWhatsAppNotification, WhatsAppNotifyError } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/format";

// Hit by an external scheduler (Vercel Cron, cron-job.org, Windows Task
// Scheduler, ...) on a daily schedule with `?secret=CRON_SECRET`. Notifies
// the admin's own WhatsApp (via Evolution API) once per calendar day for every
// invoice still unpaid past its due date - see lib/whatsapp.ts for why this
// pings the admin rather than the client directly.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const overdueInvoices = await db.query.invoices.findMany({
    where: and(inArray(invoices.status, ["sent", "overdue"]), lt(invoices.dueDate, today)),
    with: { client: true, followups: true },
  });

  const results: Array<{ invoiceId: number; notified: boolean; error?: string }> = [];

  for (const invoice of overdueInvoices) {
    const alreadyNotifiedToday = invoice.followups.some(
      (f) => f.method === "whatsapp" && f.sentAt.toISOString().slice(0, 10) === today
    );
    if (alreadyNotifiedToday) continue;

    const label = invoice.invoiceNumber || invoice.projectName;
    const text =
      `Invoice ${label} (${invoice.client.name}) sudah melewati jatuh tempo ` +
      `${invoice.dueDate}. Sisa tagihan belum lunas: ${formatCurrency(invoice.total)}.`;

    try {
      await sendWhatsAppNotification(text);
      await db.insert(invoiceFollowups).values({ invoiceId: invoice.id, method: "whatsapp" });
      if (invoice.status === "sent") {
        await db.update(invoices).set({ status: "overdue" }).where(eq(invoices.id, invoice.id));
      }
      results.push({ invoiceId: invoice.id, notified: true });
    } catch (error) {
      results.push({
        invoiceId: invoice.id,
        notified: false,
        error: error instanceof WhatsAppNotifyError ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ checked: overdueInvoices.length, results });
}
