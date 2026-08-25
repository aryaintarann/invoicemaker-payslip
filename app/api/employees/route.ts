import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { employeeInput } from "@/lib/validators";

export async function GET() {
  const rows = await db.query.employees.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = employeeInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .insert(employees)
    .values({ ...parsed.data, baseSalary: String(parsed.data.baseSalary) })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
