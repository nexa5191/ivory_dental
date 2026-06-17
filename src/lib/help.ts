// Task-wise self-help content for the Ivory Dental Suite. Each entry is a single
// task with step-by-step instructions and a deep link to the relevant module.

export interface HelpTask {
  id: string;
  title: string;
  category: string; // category key
  summary: string;
  steps: string[];
  keywords?: string[];
  href?: string;
  hrefLabel?: string;
}

export interface HelpCategory {
  key: string;
  label: string;
  icon:
    | "rocket"
    | "calendar"
    | "users"
    | "receipt"
    | "store"
    | "boxes"
    | "folder"
    | "chart"
    | "settings";
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { key: "start", label: "Getting started", icon: "rocket" },
  { key: "appointments", label: "Appointments", icon: "calendar" },
  { key: "patients", label: "Patients & charts", icon: "users" },
  { key: "billing", label: "Billing", icon: "receipt" },
  { key: "vendors", label: "Vendors & procurement", icon: "store" },
  { key: "inventory", label: "Inventory", icon: "boxes" },
  { key: "documents", label: "Documents", icon: "folder" },
  { key: "reports", label: "Dashboard & reports", icon: "chart" },
  { key: "tax", label: "Tax & GST", icon: "receipt" },
  { key: "settings", label: "Settings & theming", icon: "settings" },
];

export const HELP_TASKS: HelpTask[] = [
  // ── Getting started ──
  {
    id: "switch-branch",
    category: "start",
    title: "Switch the active clinic branch",
    summary: "Scope the whole app to one location, or view all branches together.",
    steps: [
      "Open the location switcher in the top bar (the pin icon).",
      "Pick a branch (Indiranagar, Koramangala, …) to scope dashboards and lists to it.",
      "Choose “All locations” to see combined figures across every branch.",
    ],
    keywords: ["location", "branch", "multi-location", "switch"],
  },
  {
    id: "change-currency",
    category: "start",
    title: "Change the display currency",
    summary: "All amounts convert at display time; data is stored in a single base currency.",
    steps: [
      "Use the currency selector (coins icon) in the top bar.",
      "Pick a currency — every amount re-formats instantly (₹ shows Lakh/Crore).",
    ],
    keywords: ["currency", "INR", "rupee", "money", "format"],
  },

  // ── Appointments ──
  {
    id: "book-appointment",
    category: "appointments",
    title: "Book an appointment or register a walk-in",
    summary: "Add a slot for any date; same-day bookings drop straight into the queue.",
    steps: [
      "Go to Appointments and click “Add appointment”.",
      "Set the date, time, duration and chair/room.",
      "Pick the patient, doctor, reason and visit type (in-clinic / video / phone).",
      "Save — a future date is saved as “Booked”; today’s lands in the live queue as “Arrived”.",
    ],
    keywords: ["book", "appointment", "walk-in", "schedule", "new"],
    href: "/appointments",
    hrefLabel: "Open appointments",
  },
  {
    id: "reschedule-appointment",
    category: "appointments",
    title: "Reschedule an appointment",
    summary: "Move a booking to a new date, time, duration or chair.",
    steps: [
      "On Appointments, find the booking in the List or Board view.",
      "Click the clock (reschedule) icon on the row or card.",
      "Pick the new date, time, duration and chair, then “Save new time”.",
    ],
    keywords: ["reschedule", "move", "change time", "postpone"],
    href: "/appointments",
    hrefLabel: "Open appointments",
  },
  {
    id: "filter-appointments",
    category: "appointments",
    title: "Filter appointments by stage",
    summary: "Click a status chip to show only that stage of the day.",
    steps: [
      "In the List view, the status chips (Booked, Arrived, In consult, Completed, No-show) show live counts.",
      "Click a chip to filter the list to that stage; click it again (or “All”) to clear.",
      "Use the Board view to see every stage side-by-side as columns.",
    ],
    keywords: ["filter", "status", "stage", "booked", "arrived", "queue"],
    href: "/appointments",
    hrefLabel: "Open appointments",
  },
  {
    id: "advance-queue",
    category: "appointments",
    title: "Move a patient through the queue",
    summary: "Check in → start consult → complete, or mark a no-show.",
    steps: [
      "On a booked row, click “Check in” to mark the patient Arrived.",
      "Click “Start” to move them to In consult, then “Complete” when done.",
      "Use the ✕ to mark a No-show. The dashboard live queue updates in real time.",
    ],
    keywords: ["queue", "check in", "consult", "complete", "no-show"],
    href: "/appointments",
    hrefLabel: "Open appointments",
  },

  // ── Patients ──
  {
    id: "patient-chart",
    category: "patients",
    title: "Open and update a patient chart",
    summary: "Allergies, conditions, dental chart, treatment plan, Rx and billing in one place.",
    steps: [
      "Go to Patients and select a patient (or click their name anywhere in the app).",
      "Review allergies & conditions; mark findings on the FDI dental chart per tooth.",
      "Add treatment-plan items, write prescriptions, and view their billing tab.",
    ],
    keywords: ["patient", "chart", "dental", "tooth", "allergy", "treatment plan"],
    href: "/patients",
    hrefLabel: "Open patients",
  },
  {
    id: "add-prescription",
    category: "patients",
    title: "Write a prescription",
    summary: "Add drugs with dosage, frequency and duration to a patient’s record.",
    steps: [
      "Open the patient chart and go to the Prescriptions tab.",
      "Add each drug with dosage, frequency and duration (use the common-drugs list).",
      "Save — it’s timestamped against the prescribing doctor.",
    ],
    keywords: ["prescription", "rx", "drug", "medicine", "dosage"],
    href: "/patients",
    hrefLabel: "Open patients",
  },

  // ── Billing ──
  {
    id: "create-invoice",
    category: "billing",
    title: "Create a patient invoice",
    summary: "Itemise charges and set the payment status.",
    steps: [
      "Go to Billing and click “New invoice” (or use the dashboard shortcut).",
      "Add line items and amounts; pick the payment mode.",
      "Set status — Due or Partial adds to the patient’s outstanding balance.",
    ],
    keywords: ["invoice", "bill", "charge", "payment"],
    href: "/billing",
    hrefLabel: "Open billing",
  },
  {
    id: "record-payment",
    category: "billing",
    title: "Record a payment against an invoice",
    summary: "Settle dues fully or partially; balances update automatically.",
    steps: [
      "Open the invoice in Billing.",
      "Record a payment with amount, mode and reference.",
      "The invoice status and the patient’s outstanding balance update automatically.",
    ],
    keywords: ["payment", "settle", "collect", "balance", "due"],
    href: "/billing",
    hrefLabel: "Open billing",
  },

  // ── Vendors & procurement ──
  {
    id: "register-vendor",
    category: "vendors",
    title: "Register or edit a vendor",
    summary: "Maintain the vendor master with category, contacts, GSTIN and rating.",
    steps: [
      "Go to Vendor → Vendor master and click “Register vendor”.",
      "Fill in name, category, contact, email, phone, GSTIN and rating.",
      "Use “Edit” on any card to update details or activate/deactivate the vendor.",
    ],
    keywords: ["vendor", "supplier", "register", "master", "edit"],
    href: "/vendors",
    hrefLabel: "Open vendor master",
  },
  {
    id: "import-inventory-supplier",
    category: "vendors",
    title: "Find and import an inventory supplier",
    summary: "The vendor search also surfaces inventory-module suppliers you can add.",
    steps: [
      "On Vendor master, type in the search box — it matches vendors and inventory suppliers.",
      "Matching inventory suppliers appear under “Inventory suppliers”.",
      "Click “Add to vendor master” to register one as a procurement vendor.",
    ],
    keywords: ["inventory", "supplier", "search", "import"],
    href: "/vendors",
    hrefLabel: "Open vendor master",
  },
  {
    id: "raise-rfq",
    category: "vendors",
    title: "Raise a material request and collect quotes",
    summary: "Send an RFQ to vendors by email/SMS, then compare their quotes.",
    steps: [
      "Go to Vendor → Procurement and click “New request”.",
      "Add the items needed, choose vendors and the send channel (Email / SMS / Both).",
      "“Send request” notifies vendors; “Save draft” keeps it unsent.",
      "Quotes arrive via the vendor portal (or use “Simulate vendor replies” to demo).",
      "Open the request to compare quotes — the lowest is highlighted.",
    ],
    keywords: ["rfq", "request", "quote", "procurement", "tender", "bid"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "vendor-portal",
    category: "vendors",
    title: "Share a vendor’s self-service portal link",
    summary: "Each vendor has a unique link to submit bids and track their POs.",
    steps: [
      "On a vendor card, click the link icon to copy their portal URL.",
      "Send it to the vendor — they can submit/revise quotes for RFQs sent to them.",
      "They can also track each PO’s status (received / invoiced / paid).",
    ],
    keywords: ["vendor portal", "link", "bid", "quote", "token"],
    href: "/vendors",
    hrefLabel: "Open vendor master",
  },
  {
    id: "award-po",
    category: "vendors",
    title: "Award a quote and raise a PO",
    summary: "Pick the winning quote to issue a purchase order.",
    steps: [
      "Open a request with quotes in Procurement.",
      "Review the comparison and click “Award & raise PO” on the chosen vendor.",
      "A purchase order is created and the request is marked Awarded.",
    ],
    keywords: ["award", "purchase order", "po", "finalize"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "grn-receive",
    category: "vendors",
    title: "Record a goods receipt (GRN) — partial & free stock",
    summary: "Receive against a PO line-by-line; balances and inventory update automatically.",
    steps: [
      "Open the PO in Procurement and click “Receive goods”.",
      "Each line shows ordered · received · balance; the input prefills the balance — override as needed.",
      "Tick “Vendor gave free / bonus stock” to add free units (they add to stock but aren’t billed).",
      "Confirm — received goods auto-add to Inventory; the PO becomes Partially received or Received.",
    ],
    keywords: ["grn", "goods receipt", "receive", "partial", "free stock", "bonus"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "po-lifecycle",
    category: "vendors",
    title: "Invoice, pay or close a purchase order",
    summary: "Walk a PO through Received → Invoiced → Paid, or close it.",
    steps: [
      "Open the PO and use the action buttons under the lifecycle stepper.",
      "“Record invoice” enters the vendor’s bill; “Record payment” settles it.",
      "“Close PO” finalises a short delivery and stops further receipts.",
      "Use “Open printable PO” to print or save the PO as a PDF.",
    ],
    keywords: ["invoice", "pay", "close", "po", "lifecycle", "pdf", "print"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "direct-purchase",
    category: "vendors",
    title: "Record a direct purchase (bypass RFQ/PO)",
    summary: "Log small or urgent buys in one step, optionally billed and paid.",
    steps: [
      "In Procurement, click “Direct purchase”.",
      "Pick the vendor, add items with prices, and optionally enter an invoice number.",
      "Tick “paid” to settle immediately. It’s booked as received in full and added to Inventory.",
    ],
    keywords: ["direct", "manual", "purchase", "bypass", "petty"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },

  // ── Inventory ──
  {
    id: "add-product",
    category: "inventory",
    title: "Add or edit an inventory item",
    summary: "Maintain products, categories, reorder points and cost/price.",
    steps: [
      "Go to Inventory → Products and click “Add product”.",
      "Set name, SKU, category, cost, price, reorder point and opening stock.",
      "Use the row actions to edit or remove an item later.",
    ],
    keywords: ["product", "item", "add", "sku", "reorder"],
    href: "/products",
    hrefLabel: "Open inventory",
  },
  {
    id: "record-consumption",
    category: "inventory",
    title: "Record consumption or a write-off",
    summary: "Reduce on-hand stock for treatment use, wastage, expiry or loss.",
    steps: [
      "Go to Inventory → Stock & consumption.",
      "Click “Record consumption” (treatment use) or “Write off” (expired/damaged/lost).",
      "Pick the item, quantity, location and a reason, then save — stock decrements and is logged.",
    ],
    keywords: ["consumption", "consume", "write-off", "writeoff", "wastage", "expiry", "stock out"],
    href: "/products?tab=stock",
    hrefLabel: "Open stock",
  },
  {
    id: "receive-stock",
    category: "inventory",
    title: "Receive stock into inventory",
    summary: "Add stock directly, or let a PO goods-receipt add it for you.",
    steps: [
      "On Stock & consumption, click “Receive stock” to add units manually with a reference.",
      "Alternatively, recording a GRN on a PO auto-adds the received goods here.",
      "New item names received from procurement are created automatically as consumables.",
    ],
    keywords: ["receive", "restock", "stock in", "grn", "inventory"],
    href: "/products?tab=stock",
    hrefLabel: "Open stock",
  },

  // ── Documents ──
  {
    id: "connect-cloud",
    category: "documents",
    title: "Connect a cloud storage account",
    summary: "Link Microsoft, Google Drive, Dropbox or S3 to browse documents.",
    steps: [
      "Go to Documents and click “Connect” on a provider card.",
      "Once connected, a green tick shows; click “Browse” to list that source’s files.",
    ],
    keywords: ["documents", "cloud", "connect", "onedrive", "google drive", "dropbox", "s3"],
    href: "/documents",
    hrefLabel: "Open documents",
  },
  {
    id: "search-documents",
    category: "documents",
    title: "Search across all connected documents",
    summary: "One search box looks across every connected source at once.",
    steps: [
      "On Documents, type in the search box.",
      "Results aggregate across all connected sources, each tagged with its source.",
    ],
    keywords: ["search", "documents", "universal", "find file"],
    href: "/documents",
    hrefLabel: "Open documents",
  },

  // ── Dashboard & reports ──
  {
    id: "dashboard-period",
    category: "reports",
    title: "Change the dashboard reporting period",
    summary: "View this/last month, a financial year, or a custom date range.",
    steps: [
      "On the Dashboard, use the period buttons: This month, Last month, Financial year, Custom.",
      "For Financial year, pick the specific FY from the dropdown (Apr–Mar).",
      "For Custom, set the from/to dates. Collections and appointment figures re-scope to the range.",
    ],
    keywords: ["dashboard", "period", "month", "financial year", "fy", "custom", "date range"],
    href: "/",
    hrefLabel: "Open dashboard",
  },

  // ── Settings & theming ──
  {
    id: "theme-studio",
    category: "settings",
    title: "Re-theme the app with Color Studio",
    summary: "Adjust the palette, radius and light/dark mode.",
    steps: [
      "Open the theme popover in the top bar (or Settings).",
      "Drag the hue / saturation / lightness sliders and corner radius to taste.",
      "Toggle light/dark mode; your choices persist on this device.",
    ],
    keywords: ["theme", "color", "palette", "dark mode", "branding", "radius"],
    href: "/settings",
    hrefLabel: "Open settings",
  },
  {
    id: "add-doctor-location",
    category: "settings",
    title: "Add a doctor or a clinic location",
    summary: "Grow the clinical team and branch list.",
    steps: [
      "Go to Doctors and click “Add doctor” (name, specialty, registration no.).",
      "Go to Locations and click “Add location” (branch name, address, contacts, chairs).",
    ],
    keywords: ["doctor", "location", "branch", "add", "team"],
    href: "/doctors",
    hrefLabel: "Open doctors",
  },

  // ── newer features ──
  {
    id: "block-doctor-leave",
    category: "appointments",
    title: "Block a doctor's calendar (leave)",
    summary: "Mark whole days or specific hours off so no appointments get booked then.",
    steps: [
      "Go to Doctors and click “Block calendar / leave” on a doctor.",
      "Choose “Whole day(s)” with a date range, or “Specific hours” with a from–to time on a day.",
      "Add a reason and block it. Booking or rescheduling onto that slot is then prevented with a warning.",
    ],
    keywords: ["leave", "block", "calendar", "doctor", "away", "holiday", "off", "hours"],
    href: "/doctors",
    hrefLabel: "Open doctors",
  },
  {
    id: "trace-journey",
    category: "patients",
    title: "Trace a patient's history & open a visit",
    summary: "Filter the journey and click any visit to see the work done.",
    steps: [
      "Open a patient and go to the Journey tab.",
      "Use the sub-tabs (Appointments / Prescriptions / Invoices / Treatments) to filter.",
      "Click a visit to open its detail — clinical notes plus that day's prescriptions & invoices — then use “Back to patient journey”.",
    ],
    keywords: ["journey", "history", "visit", "trace", "timeline", "ledger"],
    href: "/patients",
    hrefLabel: "Open patients",
  },
  {
    id: "tooth-work-bill",
    category: "patients",
    title: "Log per-tooth work & invoice it",
    summary: "Record a procedure and fee on a tooth, then bill the work.",
    steps: [
      "Open the patient → Dental chart. Toggle numbering between UR/UL/LR/LL and FDI if you prefer.",
      "Click a tooth, set a finding, and under “Log work & fee” add a procedure + fee (mark Done if completed).",
      "In the Treatment & work card click “Invoice this work”, pick lines, and create the invoice. Billed work then drops off the list.",
    ],
    keywords: ["tooth", "work", "fee", "treatment", "invoice", "bill", "procedure", "fdi"],
    href: "/patients",
    hrefLabel: "Open patients",
  },
  {
    id: "upload-xray",
    category: "patients",
    title: "Upload X-rays & clinical photos",
    summary: "Attach radiographs/images to the patient's dental chart.",
    steps: [
      "Open the patient → Dental chart → the X-rays & images card.",
      "Click Upload and select one or more images; thumbnails appear and open full-size on click.",
    ],
    keywords: ["xray", "x-ray", "image", "photo", "radiograph", "upload"],
    href: "/patients",
    hrefLabel: "Open patients",
  },
  {
    id: "view-invoice",
    category: "billing",
    title: "View / print an invoice (with prescription)",
    summary: "Open a printable invoice; billed prescriptions print as a second section.",
    steps: [
      "On Billing, click “View” on any invoice to open the printable document, then Print / Save as PDF.",
      "If the invoice was raised from a prescription, the PDF includes Section 1 (Invoice) and Section 2 (Prescription).",
    ],
    keywords: ["invoice", "view", "print", "pdf", "prescription", "section"],
    href: "/billing",
    hrefLabel: "Open billing",
  },
  {
    id: "amounts-currency",
    category: "billing",
    title: "How amounts & currency work",
    summary: "Type fees in your active currency — they're stored and shown as entered.",
    steps: [
      "Pick your currency in the top bar (₹ by default).",
      "Enter fees/amounts in that currency on treatment and invoice forms — what you type is what shows.",
      "Switch currency anytime to re-display every figure converted.",
    ],
    keywords: ["amount", "currency", "inr", "rupee", "manual", "fee", "convert"],
  },
  {
    id: "split-award",
    category: "vendors",
    title: "Compare quotes & split the award",
    summary: "Award each line to a different vendor — one PO per vendor.",
    steps: [
      "Open a quoted request in Procurement to see vendor totals side by side.",
      "Under each item, pick the winning vendor (lowest is pre-selected) — choose different vendors to split.",
      "Review the PO preview, then “Award & raise PO(s)” to generate one purchase order per vendor.",
    ],
    keywords: ["compare", "split", "partial", "award", "quote", "vendor", "po"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "filter-procurement",
    category: "vendors",
    title: "Filter procurement by KPI",
    summary: "Click a KPI card to focus the lists.",
    steps: [
      "On Procurement, click a KPI: Open requests, Awaiting quotes, PO value, or Payables due.",
      "The lists below filter to match; click Active vendors (or the card again) to clear.",
    ],
    keywords: ["filter", "kpi", "payables", "open requests", "procurement"],
    href: "/vendors?tab=procurement",
    hrefLabel: "Open procurement",
  },
  {
    id: "nav-font-theme",
    category: "settings",
    title: "Change navigation layout & font",
    summary: "Switch between a left pane and a top ribbon, and pick the app font.",
    steps: [
      "Go to Settings → Navigation layout and choose Left pane or Top ribbon.",
      "In Appearance, use Color Studio for the palette and the font picker for the typeface.",
    ],
    keywords: ["navigation", "ribbon", "sidebar", "font", "theme", "layout", "appearance"],
    href: "/settings",
    hrefLabel: "Open settings",
  },
  {
    id: "compare-features",
    category: "settings",
    title: "See the features & competitor comparison",
    summary: "An MVP feature matrix and value-add summary for demos.",
    steps: [
      "Go to Settings → Features & comparison.",
      "Review the value-add cards and the feature matrix (Ivory vs legacy software vs spreadsheets).",
    ],
    keywords: ["compare", "competitor", "features", "value", "mvp", "matrix"],
    href: "/settings/compare",
    hrefLabel: "Open comparison",
  },

  // ── Tax & GST ──
  {
    id: "view-gst-returns",
    category: "tax",
    title: "View GST returns (GSTR-1, 3B, 9)",
    summary: "The Tax / GST module turns your billing and purchases into ready-to-file GST working papers.",
    steps: [
      "Open Reports from the main navigation, then switch to the “Tax reports” tab.",
      "Choose a group — GST returns, TDS, or Books vs Return — then pick a report (GSTR-1, HSN/SAC, GSTR-2B, GSTR-3B, GSTR-9).",
      "The KPI strip shows output GST, input-tax credit, net GST payable and TDS payable/receivable for the chosen filters.",
    ],
    keywords: ["gst", "gstr", "gstr1", "gstr3b", "gstr9", "return", "tax", "itc", "filing", "tds"],
    href: "/reports?view=tax",
    hrefLabel: "Open Tax reports",
  },
  {
    id: "gst-filters",
    category: "tax",
    title: "Filter GST data by period, GSTIN, rate & nature",
    summary: "GST-specific filters mirror the fields you file with.",
    steps: [
      "Open Reports → Tax reports, then expand “GST filters”.",
      "Choose a return period — a financial year (Apr–Mar) or a single tax month.",
      "Narrow by GSTIN/branch, GST rate (Exempt/5/12/18/28%), supply nature (intra vs inter-state), supply type (B2B/B2C) or reconciliation status (pending/reconciled).",
      "Click Apply filters. Use Export PDF to save the return as working papers.",
    ],
    keywords: ["filter", "period", "financial year", "gstin", "rate", "intra", "inter", "igst", "cgst", "sgst", "b2b", "b2c"],
    href: "/reports?view=tax",
    hrefLabel: "Open Tax reports",
  },
  {
    id: "gst-on-invoices",
    category: "tax",
    title: "Understand HSN/SAC & tax on invoices",
    summary: "Every invoice and purchase order now shows its HSN/SAC code and CGST/SGST/IGST breakup.",
    steps: [
      "Open any invoice from Billing — the line table shows HSN/SAC, GST rate, taxable value and the tax breakup.",
      "Dental treatment, consultations and X-rays are exempt healthcare (0%); teeth whitening and cosmetic work are 18%; crowns/implants carry 5% on lab material.",
      "On purchase orders, out-of-state vendors charge IGST while local vendors charge CGST + SGST — shown in the PO totals.",
    ],
    keywords: ["hsn", "sac", "invoice", "exempt", "healthcare", "cosmetic", "crown", "implant", "cgst", "sgst", "igst", "purchase"],
    href: "/billing",
    hrefLabel: "Open billing",
  },
  {
    id: "tds-payable-receivable",
    category: "tax",
    title: "Track TDS payable & receivable (26Q / 26AS)",
    summary: "Deduct TDS on vendor payments and capture TDS withheld by B2B clients — with a full audit trail.",
    steps: [
      "Open Reports → Tax reports and choose the “TDS” group.",
      "TDS payable (26Q): TDS we deduct on vendor bills (set the section & rate on the vendor). Expand a row and record the deposit challan (CIN) to knock it off.",
      "TDS receivable (26AS): TDS withheld by corporate/insurer (B2B) clients on our fees. Expand a row and record the Form 16A certificate number once it reflects in 26AS.",
      "The KPI cards switch to TDS — showing payable, deposited, pending, receivable and amounts still awaited.",
      "Every tag/knock-off is logged in the row’s audit trail and can be reversed.",
    ],
    keywords: ["tds", "26q", "26as", "challan", "cin", "16a", "certificate", "194c", "194j", "194q", "deduct", "payable", "receivable", "audit"],
    href: "/reports?view=tax",
    hrefLabel: "Open Tax reports",
  },
  {
    id: "gst-books-vs-return",
    category: "tax",
    title: "Reconcile books vs returns & find unclaimed items",
    summary: "Tag invoices as filed and bills as ITC-claimed, then see exactly what is still pending.",
    steps: [
      "In GSTR-1, expand any invoice and mark it filed (record the ARN); in GSTR-2B, expand a bill and mark its ITC claimed.",
      "Open the “Books vs Return” group to compare what is in your books against what has been reported/claimed — the gap rows are highlighted.",
      "To work the gap, use the “Reconciliation” filter (Pending only) on GSTR-1 or GSTR-2B to list every unfiled invoice or unclaimed bill.",
      "MSME suppliers are flagged throughout (they must be paid within 45 days).",
    ],
    keywords: ["reconcile", "reconciliation", "books", "return", "gap", "unclaimed", "unfiled", "missing", "itc", "claimed", "filed", "arn", "msme"],
    href: "/reports?view=tax",
    hrefLabel: "Open Tax reports",
  },
  {
    id: "vendor-gst-master",
    category: "vendors",
    title: "Capture vendor GSTIN, MSME, banking & TDS",
    summary: "Auto-fill GST details, hold multiple GSTINs per vendor, and record MSME, bank and TDS settings.",
    steps: [
      "Register or edit a vendor and use the GSTN & Addresses block — type a GSTIN and click Auto-fill to pull the legal/trade name, PAN and principal place of business.",
      "Add more than one GSTIN with “Add another GSTIN” (all must share the same PAN — one vendor : one PAN is enforced); mark one as primary.",
      "Tick “Registered under MSME” to capture the Udyam number, fill banking details for remittances, and enable TDS with a section (194C/J/Q…) and rate.",
      "Use “Verify on GST portal” to cross-check the GSTIN on the government site.",
    ],
    keywords: ["vendor", "gstin", "auto-fill", "autofill", "pan", "msme", "udyam", "bank", "ifsc", "tds", "multi-gstin", "trade name", "address"],
    href: "/vendors",
    hrefLabel: "Open vendors",
  },
];
