# Mock → DB Migration Tracker

Tracks which domains have been migrated from in-memory mock singletons to Prisma/PostgreSQL.
Follow the three-layer pattern in CLAUDE.md when working on any item below.

---

## Status Key

- ✅ Done — Prisma query functions + API routes + server components all wired
- 🔲 Pending — still reading from mock lib

---

## Clinic Domain (`lib/clinic.ts` → `src/lib/db/`)

### ✅ Providers (Doctors)

- Query functions: `src/lib/db/providers.ts`
- API routes: `src/app/api/doctors/route.ts`, `src/app/api/doctors/[id]/route.ts`
- Server components: `src/app/(main)/doctors/page.tsx`
- Prisma model: `Provider`

### ✅ Patients

- Query functions: `src/lib/db/patients.ts`
- API routes: `src/app/api/patients/route.ts`, `src/app/api/patients/[id]/route.ts`
- Server components: `src/app/(main)/patients/page.tsx`, `src/app/(main)/patients/[id]/page.tsx`
- Prisma models: `Patient`
- Note: `ToothFinding`, `TreatmentItem`, `XrayImage` are relations on Patient — migrate together with patient detail sub-resources below.

### 🔲 Patient Sub-resources (Tooth Chart, Treatment Plan, X-rays)

Displayed in `PatientChart` component on `/patients/[id]`. Currently returns empty arrays.

- Query functions to create: `src/lib/db/tooth-findings.ts`, `src/lib/db/treatment-items.ts`, `src/lib/db/xrays.ts`
- API routes to create: `src/app/api/patients/[id]/tooth-findings/`, `src/app/api/patients/[id]/treatment-plan/`, `src/app/api/patients/[id]/xrays/`
- Server component: `src/app/(main)/patients/[id]/page.tsx` — remove `toothFindings: {}` and `treatmentPlan: []` defaults; pass real data
- Prisma models: `ToothFinding`, `TreatmentItem`, `XrayImage`
- Client component: `components/clinic/patient-chart.tsx` (check what shape it expects)

### 🔲 Appointments

- Mock source: `appointments` array + `addAppointment()` in `lib/clinic.ts`
- Query functions to create: `src/lib/db/appointments.ts`
- API routes to update: `src/app/api/appointments/route.ts`, `src/app/api/appointments/[id]/route.ts`
- Server components to update: `src/app/(main)/appointments/page.tsx`
- Prisma model: `Appointment`
- Note: references `Provider` (Int FK) and `Patient` (Int FK) — both are already migrated.

### 🔲 Prescriptions

- Mock source: `prescriptions` array + `addPrescription()` in `lib/clinic.ts`
- Query functions to create: `src/lib/db/prescriptions.ts`
- API routes to update: `src/app/api/prescriptions/route.ts`, `src/app/api/prescriptions/[id]/route.ts`
- Server components to update: patient detail page passes `prescriptionsFor(patient.id)` — switch to DB query
- Prisma models: `Prescription`, `PrescriptionItem`
- Note: `prescriptionsFor()` in `lib/clinic.ts` is a mock helper — remove when migrated.

### 🔲 Visits

- Mock source: `visits` array + `addVisit()` in `lib/clinic.ts`
- Query functions to create: `src/lib/db/visits.ts`
- API routes to update: `src/app/api/visits/route.ts` (check if exists, may need creation)
- Server components to update: patient detail page passes `visitsFor(patient.id)` — switch to DB query
- Prisma model: `Visit`
- Note: `visitsFor()` mock helper to remove when migrated.

### 🔲 Invoices & Payments

- Mock source: `invoices` array + `addInvoice()` in `lib/clinic.ts`
- Query functions to create: `src/lib/db/invoices.ts`
- API routes to update: `src/app/api/invoices/route.ts`, `src/app/api/invoices/[id]/route.ts`
- Server components to update: patient detail page passes `invoicesFor(patient.id)` — switch to DB query
- Prisma models: `Invoice`, `InvoiceItem`, `Payment`
- Note: `Invoice.id` is a String PK (e.g. `INV-2001`), not an Int — no `parseId` needed; use raw string param.

### 🔲 Locations (Clinic Branches)

- Mock source: `locations` array in `lib/clinic.ts`
- Query functions to create: `src/lib/db/locations.ts`
- API routes to update: `src/app/api/locations/route.ts`, `src/app/api/locations/[id]/route.ts`
- Server components to update: `src/app/(main)/locations/page.tsx`
- Prisma model: `Location`
- Note: `Location.id` is a String PK (stable branch key == name), not an Int.

### 🔲 TimeOff (Doctor Leave)

- Mock source: `timeOff` array + `addTimeOff()` in `lib/clinic.ts`
- Query functions to create: `src/lib/db/time-off.ts`
- API routes to update: `src/app/api/timeoff/route.ts`, `src/app/api/timeoff/[id]/route.ts`
- Prisma model: `TimeOff`
- Note: Foreign key to `Provider` (Int). `from`/`to` are YYYY-MM-DD strings.

---

## Inventory Domain (`lib/store.ts` → `src/lib/db/`)

### 🔲 Suppliers

- Query functions to create: `src/lib/db/suppliers.ts`
- API routes to update: `src/app/api/suppliers/route.ts`, `src/app/api/suppliers/[id]/route.ts`
- Server components to update: `src/app/(main)/products/page.tsx` (suppliers tab)
- Prisma model: `Supplier`

### 🔲 Products

- Query functions to create: `src/lib/db/products.ts`
- API routes to update: `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`
- Server components to update: `src/app/(main)/products/page.tsx`
- Prisma models: `Product`, `ProductStock`
- Note: `stock` field on Product is a cache of sum of `ProductStock.qty` — keep in sync on movement writes.

### 🔲 Stock Movements

- API route to update: `src/app/api/stock/movements/route.ts`
- Prisma model: `Movement`
- Note: Currently mutates in-memory `ProductStock` map. After migration, write a `Movement` row and update `ProductStock.qty` + `Product.stock` in a transaction.

### 🔲 Orders (Inventory Purchase/Sales Orders)

- Query functions to create: `src/lib/db/orders.ts`
- API routes to update: `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`
- Prisma models: `Order`, `OrderLine`
- Note: `Order.id` is a String PK (e.g. `PO-1043`).

---

## Procurement Domain (`lib/vendors.ts` → `src/lib/db/`)

### 🔲 Vendors

- Query functions to create: `src/lib/db/vendors.ts`
- API routes to update: `src/app/api/vendors/route.ts`, `src/app/api/vendors/[id]/route.ts`
- Server components to update: `src/app/(main)/procurement/page.tsx` or vendors tab
- Prisma models: `Vendor`, `GstRegistration`
- Public portal routes `vendor-portal/[token]` and `vendor-register/[token]` must switch to DB lookup by `Vendor.token`.

### 🔲 Vendor Invites

- Prisma model: `VendorInvite`
- Note: `VendorInvite.token` is the PK (String). Public routes use this for unauthenticated access.

### 🔲 RFQs (Request for Quotation)

- Query functions to create: `src/lib/db/rfqs.ts`
- API routes to update: `src/app/api/procurement/rfqs/route.ts`, `src/app/api/procurement/rfqs/[id]/route.ts`
- State-machine routes to update: `src/app/api/procurement/rfqs/[id]/send|quote|award/route.ts`
- Prisma models: `Rfq`, `RfqItem`, `RfqAward`

### 🔲 Quotes

- Prisma models: `Quote`, `QuoteLine`
- Handled as part of RFQ migration (quotes are always attached to an RFQ).

### 🔲 Purchase Orders (Procurement)

- Prisma models: `PurchaseOrder`, `POItem`, `GoodsReceipt`, `GoodsReceiptLine`
- Note: `PurchaseOrder.id` is a String PK (e.g. `PO-1001`). Distinct from inventory `Order`.

---

## GST / Tax Domain (`lib/gst.ts`, `lib/compliance.ts` → `src/lib/db/`)

### 🔲 Compliance Records

- Query functions to create: `src/lib/db/compliance.ts`
- Prisma models: `ComplianceRecord`, `ComplianceTrailEvent`
- Note: `ComplianceRecord.id` is a polymorphic String key (invoice id, PO id, or prefixed TDS key).

### 🔲 GSTR-1 Filings

- Prisma model: `Gstr1Filing`
- Note: PK is the period string `YYYY-MM`.

### 🔲 Cash Ledger & Credit Ledger

- Prisma models: `CashLedgerEntry`, `CreditLedgerEntry`, `FiledReturn3B`

### 🔲 RCM Inward Supplies

- Prisma model: `RcmInwardSupply`

### 🔲 Job-Work Challans (ITC-04)

- Prisma model: `JobWorkChallan`
- Note: `JobWorkChallan.challanNo` is the String PK.

---

## Migration Order (Recommended)

Migrate in dependency order — referenced models first:

1. Locations (no FKs to migrated models)
2. Appointments (needs Provider ✅ + Patient ✅)
3. Prescriptions + PrescriptionItems (needs Provider ✅ + Patient ✅)
4. Visits (needs Provider ✅ + Patient ✅)
5. Patient sub-resources — ToothFindings, TreatmentPlan, XrayImages (needs Patient ✅)
6. Invoices + InvoiceItems + Payments (needs Patient ✅)
7. TimeOff (needs Provider ✅)
8. Suppliers → Products + ProductStock → Movements → Orders
9. Vendors + VendorInvites → RFQs + Quotes → PurchaseOrders + GoodsReceipts
10. GST/Tax domain (no domain FKs — compliance keys are polymorphic strings)
