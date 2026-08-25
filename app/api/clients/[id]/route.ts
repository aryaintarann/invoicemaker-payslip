import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { clientInput } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.clients.findFirst({
    where: eq(clients.id, Number(id)),
  });
  if (!row) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = clientInput.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(clients)
    .set(parsed.data)
    .where(eq(clients.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.delete(clients).where(eq(clients.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
