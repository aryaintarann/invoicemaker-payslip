# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT
- ALWAYS USE CONTEXT7 BEFORE MAKE ANY CHANGE
- ALWAYS USE SKILLS or MCP or PLUGINS BEFORE MAKE ANY CHANGE
- ALWAYS DO GIT ADD, GIT COMMIT, AND GIT PUSH AFTER MAKE CHANGE
- NEVER PUT SENSITIVE DATA ON THE FRONT END AND GITHUB

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npm run db:push      # push db/schema.ts to the database via drizzle-kit (no migration files are used)
npm run db:studio    # open Drizzle Studio
```

There is no test suite configured. Requires `DATABASE_URL`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` in `.env.local` (see `.env.example`); `GOTENBERG_URL` is optional (PDF download degrades to `.docx`/`.xlsx` download without it).

## Architecture

Personal single-user Next.js App Router app (Indonesian-language UI) for generating client invoices and employee payslips from user-supplied Word/Excel templates, backed by Neon Postgres via Drizzle ORM.

**Auth**: not NextAuth — a minimal custom scheme. `lib/session.ts` signs an HMAC session token (`AUTH_SECRET`) stored in a cookie; credentials checked against `AUTH_USERNAME`/`AUTH_PASSWORD` env vars (single hardcoded user, no users table). `proxy.ts` is the Next.js middleware entry point (exports `proxy`, not `middleware`) that gates every route except `/login` and `/api/auth/login`, redirecting unauthenticated page requests to `/login` and returning 401 JSON for `/api/*`.

**Data layer**: `db/index.ts` creates the Drizzle client (`neon-http` driver) from `DATABASE_URL`. `db/schema.ts` defines `clients`, `employees`, `invoices`, `invoiceFollowups` (reserved, unused — no follow-up feature is implemented despite `PRD.md`/`ARCHITECTURE.md` describing one), and `payslips`. There's no migrations directory — schema changes go live via `npm run db:push`.

**Invoice model is progress-billing, not line-items**: an invoice bills a percentage (`invoicePercent`) of a project's total `contractValue`, producing `billedAmount`/`remainingAmount` — not a list of `invoice_items`. `entity` (`cv` | `op`) and `kind` (`dp` | `final`) select which of 8 template files to fill; `language` (`id` | `en`) picks the wording. Tax (PPN/PPh) applies only per `lib/invoice-tax.ts` `invoiceHasTax()` — normally `cv` only, but `op`+`final`+`en` is a real, confirmed exception baked into that user-supplied template. Don't "fix" that asymmetry without checking with the user first.

**Document generation** (`lib/docx.ts`, `lib/excel.ts`): templates are user-supplied, real files under `templates/invoice/{entity}/{language}/{kind}.docx` and `templates/slip-gaji/template.xlsx` — never edit their static/placeholder layout without reading the matching README (`templates/invoice/README.md`, `templates/slip-gaji/README.md`) first, since sender bank/signature data is baked statically into each file.
- Invoices use **docxtemplater** with `{tag}` placeholders (`lib/docx.ts`).
- Payslips use **direct sheet-XML surgery** on the `.xlsx`'s `xl/worksheets/sheet1.xml` via PizZip (`lib/excel.ts`), *not* ExcelJS — ExcelJS's read/write roundtrip was found to silently drop the template's text-box shapes. If you touch payslip generation, preserve this approach; don't reintroduce a load-and-resave library.
- `.docx`/`.xlsx` template files themselves are gitignored (business-sensitive); only their READMEs are tracked.

**PDF conversion** (`lib/pdf.ts`): delegates to an external Gotenberg (LibreOffice) HTTP service via `GOTENBERG_URL` rather than shelling out to LibreOffice in-process — this is what keeps the app deployable on Vercel (see `ARCHITECTURE.md` §2 for the reasoning). If `GOTENBERG_URL` is unset, PDF download simply isn't offered; this is an expected, handled state (`PdfServiceUnavailableError`), not a bug.

**Tax documents on invoices**: `bukti potong pajak` (tax withholding) and `faktur pajak` (tax invoice) are stored as raw `bytea` columns directly on the `invoices` row (`db/schema.ts`'s custom `bytea` type), not in object storage — see `app/api/invoices/[id]/documents/[type]/route.ts`. Upload/status/download is generic over `type` (`tax-withholding` | `tax-invoice`) via a `docTypes` map; "uploaded" status is derived from `*FileName` being non-null rather than a separate status column, so it can't drift from the actual file. Max upload size is capped at 4 MB to stay under Vercel's ~4.5 MB serverless request body limit.

**Client/server split**: all data access from client components goes through `lib/api-client.ts` (typed `clientsApi`/`employeesApi`/`invoicesApi`/`payslipsApi` wrappers around `fetch`), paired with TanStack Query (`app/providers/`) for caching — don't call `db` directly from client components or bypass `api-client.ts` with ad-hoc fetches.

**Routes mirror data models** 1:1 under `app/` and `app/api/`: `clients/`, `employees/`, `invoices/`, `payslips/`, each with `page.tsx` (list, client-side search), `new/page.tsx`, `[id]/page.tsx` (detail), and `[id]/edit/page.tsx` where applicable, plus matching `app/api/<model>/route.ts` + `[id]/route.ts` CRUD handlers.

## Reference docs in this repo

`PRD.md` and `ARCHITECTURE.md` describe the original product vision (Indonesian) and include some not-yet-built pieces (email follow-ups, LibreOffice-on-VPS deployment) that were superseded by the current Gotenberg-based approach actually implemented — treat the code as source of truth over these docs when they disagree.
