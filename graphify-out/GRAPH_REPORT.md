# Graph Report - invoicemaker-payslip  (2026-08-27)

## Corpus Check
- Corpus is ~21,738 words - fits in a single context window. You may not need a graph.

## Summary
- 502 nodes · 994 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 132,476 input · 0 output

## Community Hubs (Navigation)
- Login & Alert-Dialog UI
- Client/Employee Pages & Forms
- CRUD API Routes
- Architecture Concepts & Rationale
- Runtime Dependencies
- Document Generation (docx/xlsx)
- Build & Dev Tooling
- Invoice API & Forms
- TypeScript Config
- shadcn Component Config
- App Shell & Providers
- Status Badges & Detail Pages
- HMAC Auth & Middleware
- Auth Design Notes
- MCP Config
- Boilerplate Icon Assets
- ESLint Config
- Next.js Config
- PostCSS Config
- Brand Logo Assets
- create-next-app README

## God Nodes (most connected - your core abstractions)
1. `cn()` - 77 edges
2. `Button()` - 21 edges
3. `PageHeader()` - 16 edges
4. `compilerOptions` - 16 edges
5. `formatCurrency()` - 15 edges
6. `Card()` - 13 edges
7. `CardContent()` - 13 edges
8. `Input()` - 13 edges
9. `db` - 13 edges
10. `invoiceHasTax()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `lib/pdf.ts Gotenberg Delegation` --semantically_similar_to--> `LibreOffice Headless PDF Conversion`  [INFERRED] [semantically similar]
  CLAUDE.md → ARCHITECTURE.md
- `Invoice & Payslip Product Vision` --semantically_similar_to--> `Generate PDF from Template Flow`  [INFERRED] [semantically similar]
  PRD.md → ARCHITECTURE.md
- `Minimal Custom HMAC Auth` --semantically_similar_to--> `Simple Single-User Auth`  [INFERRED] [semantically similar]
  CLAUDE.md → ARCHITECTURE.md
- `Invoice Template Selection by entity/language/kind` --semantically_similar_to--> `Entity/Kind/Language Template Matrix`  [INFERRED] [semantically similar]
  templates/invoice/README.md → CLAUDE.md
- `Why Not ExcelJS (Text Box Loss)` --semantically_similar_to--> `Direct Sheet-XML Surgery for Payslips`  [INFERRED] [semantically similar]
  templates/slip-gaji/README.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Invoice Document Generation Pipeline** — claude_lib_docx, architecture_docxtemplater, templates_invoice_readme_template_selection, claude_gotenberg_service [INFERRED 0.75]
- **Payslip XLSX XML-Surgery Pipeline** — claude_lib_excel, architecture_pizzip, templates_slip_gaji_readme_cell_mapping, templates_slip_gaji_readme_why_not_exceljs [INFERRED 0.75]
- **Superseded VPS/LibreOffice/Email Vision** — architecture_not_full_vercel, architecture_vps_deployment, architecture_followup_flow, claude_docs_superseded [INFERRED 0.65]
- **Next.js create-next-app default SVG assets** — public_file_svg_file_icon, public_globe_svg_globe_icon, public_next_svg_nextjs_logo, public_vercel_svg_vercel_logo, public_window_svg_window_icon [INFERRED 0.85]

## Communities (22 total, 6 thin omitted)

### Community 0 - "Login & Alert-Dialog UI"
Cohesion: 0.05
Nodes (46): LoginForm(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+38 more)

### Community 1 - "Client/Employee Pages & Forms"
Cohesion: 0.10
Nodes (31): DeleteConfirmButton(), PageHeader(), statuses, statusLabel, cards, EditForm(), toFormValues(), emptyPayslipForm (+23 more)

### Community 2 - "CRUD API Routes"
Cohesion: 0.06
Nodes (35): GET(), allowedMimeTypes, DELETE(), DocType, docTypes, GET(), POST(), resolveDocType() (+27 more)

### Community 3 - "Architecture Concepts & Rationale"
Cohesion: 0.05
Nodes (48): Next.js Agent Rules Block, Read next/dist/docs Before Coding, Cron Scheduler, Cron Endpoint Secret Protection, Database Schema (Drizzle), docxtemplater, Drizzle ORM, ExcelJS (+40 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (39): @base-ui/react, class-variance-authority, clsx, date-fns, docxtemplater, drizzle-orm, lucide-react, @neondatabase/serverless (+31 more)

### Community 5 - "Document Generation (docx/xlsx)"
Cohesion: 0.11
Nodes (29): GET(), GET(), extractDocxtemplaterError(), fillInvoiceTemplate(), formatAmount(), formatPercent(), InvoiceTemplateData, templateKindFor() (+21 more)

### Community 6 - "Build & Dev Tooling"
Cohesion: 0.06
Nodes (31): drizzle-kit, eslint, eslint-config-next, devDependencies, drizzle-kit, eslint, eslint-config-next, shadcn (+23 more)

### Community 7 - "Invoice API & Forms"
Cohesion: 0.14
Nodes (18): computeAmounts(), PATCH(), computeAmounts(), POST(), NativeSelect(), EditForm(), toFormValues(), emptyInvoiceForm (+10 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "shadcn Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "App Shell & Providers"
Cohesion: 0.13
Nodes (11): AppHeader(), navLinks, AppMain(), LogoutButton(), ThemeProvider(), ThemeToggle(), geistMono, geistSans (+3 more)

### Community 11 - "Status Badges & Detail Pages"
Cohesion: 0.16
Nodes (12): StatusBadge(), statusClass, statusLabel, EmployeesPage(), InvoiceDetailPage(), InvoicesPage(), PayslipDetailPage(), PayslipsPage() (+4 more)

### Community 12 - "HMAC Auth & Middleware"
Cohesion: 0.26
Nodes (9): POST(), createSessionToken(), SESSION_COOKIE, sign(), verifyCredentials(), verifySessionToken(), config, proxy() (+1 more)

### Community 13 - "Auth Design Notes"
Cohesion: 0.50
Nodes (4): Simple Single-User Auth, Minimal Custom HMAC Auth, CLAUDE.md Project Instructions, proxy.ts Middleware Entry

### Community 15 - "Boilerplate Icon Assets"
Cohesion: 0.67
Nodes (3): file.svg document icon asset, globe.svg globe icon asset, window.svg browser window icon asset

## Knowledge Gaps
- **134 isolated node(s):** `npx`, `docTypes`, `DocType`, `allowedMimeTypes`, `navLinks` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Login & Alert-Dialog UI` to `Client/Employee Pages & Forms`, `App Shell & Providers`, `Status Badges & Detail Pages`, `Invoice API & Forms`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `Status Badges & Detail Pages` to `Client/Employee Pages & Forms`, `CRUD API Routes`, `Document Generation (docx/xlsx)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `npx`, `docTypes`, `DocType` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Login & Alert-Dialog UI` be split into smaller, more focused modules?**
  _Cohesion score 0.053994732221246705 - nodes in this community are weakly interconnected._
- **Should `Client/Employee Pages & Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.10221619176843058 - nodes in this community are weakly interconnected._
- **Should `CRUD API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05819209039548023 - nodes in this community are weakly interconnected._
- **Should `Architecture Concepts & Rationale` be split into smaller, more focused modules?**
  _Cohesion score 0.04875886524822695 - nodes in this community are weakly interconnected._