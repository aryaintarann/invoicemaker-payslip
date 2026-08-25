import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { clientInput } from "@/lib/validators";

export async function GET() {
  const rows = await db.query.clients.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = clientInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db.insert(clients).values(parsed.data).returning();
  return NextResponse.json(row, { status: 201 });
}
