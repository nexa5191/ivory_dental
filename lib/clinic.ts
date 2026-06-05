// Clinic-SaaS mock domain: providers, patients, appointments, prescriptions,
// dental charts, treatment plans, invoices, visits. In-memory singleton store.
// All money is stored in USD base; the <Money> component converts at display.

export type Gender = "M" | "F" | "Other";
export type ApptType = "in-clinic" | "video" | "phone";
export type ApptStatus = "booked" | "arrived" | "in-consult" | "completed" | "no-show";
export type ToothStatus =
  | "healthy"
  | "caries"
  | "filled"
  | "crown"
  | "rct"
  | "missing"
  | "implant";
export type InvoiceStatus = "paid" | "due" | "partial";

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  reg: string;
  color: string; // hsl chart var hue index 1-5
}

export interface Prescription {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  items: { drug: string; dosage: string; frequency: string; duration: string; notes?: string }[];
  advice?: string[]; // free-text bullet-point instructions/advice
  patientName?: string; // override; defaults to the patient's name
  prescriberName?: string; // override; defaults to the provider's name
  signName?: string; // override; defaults to the prescriber name
}

export interface TreatmentItem {
  id: string;
  tooth: number | null;
  procedure: string;
  phase: number;
  estimate: number; // USD
  status: "planned" | "in-progress" | "done";
  billed?: boolean; // hidden from the chart's work list once invoiced
}

export interface Visit {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  complaint: string;
  notes: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  anniversary?: string; // wedding anniversary
  gender: Gender;
  phone: string;
  email: string;
  bloodGroup: string;
  abhaId?: string;
  gstin?: string; // for corporate/insurer (B2B) patients
  allergies: string[];
  conditions: string[];
  balance: number; // USD outstanding
  lastVisit: string;
  emoji: string;
  toothFindings: Record<number, ToothStatus>;
  treatmentPlan: TreatmentItem[];
  xrays?: XrayImage[];
}

export interface XrayImage {
  id: string;
  name: string;
  dataUrl: string; // base64 data URL (no real storage in this mock)
  date: string;
  tooth?: number | null;
  note?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  start: string; // ISO
  durationMin: number;
  type: ApptType;
  status: ApptStatus;
  reason: string;
  chair: string;
}

export type PayMode = "cash" | "card" | "upi" | "online";

export interface Payment {
  amount: number; // USD
  mode: PayMode;
  reference?: string;
  date: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  date: string;
  items: { desc: string; amount: number }[];
  total: number; // USD
  status: InvoiceStatus;
  mode: PayMode;
  payments?: Payment[];
  rxId?: string; // linked prescription (for combined invoice + Rx print)
}

// FDI tooth numbering, upper then lower rows (stored key). Display uses a
// simpler Upper/Lower scheme — see toothLabel().
export const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Friendly label by quadrant + position: Upper/Lower × Right/Left, 1–8 from the
// midline outward. e.g. UR1 = upper-right central incisor, LL8 = lower-left wisdom.
export function toothLabel(fdi: number): string {
  const q = Math.floor(fdi / 10);
  const p = fdi % 10;
  const pre = q === 1 ? "UR" : q === 2 ? "UL" : q === 3 ? "LL" : q === 4 ? "LR" : "";
  return pre ? `${pre}${p}` : String(fdi);
}

// Fixed, clinically-distinct colours (independent of the app theme) so the
// six findings never look alike.
export const TOOTH_META: Record<ToothStatus, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "#94a3b8" },
  caries: { label: "Caries", color: "#ef4444" }, // red
  filled: { label: "Filled", color: "#3b82f6" }, // blue
  crown: { label: "Crown", color: "#a855f7" }, // purple
  rct: { label: "Root canal", color: "#f97316" }, // orange
  missing: { label: "Missing", color: "#cbd5e1" }, // grey
  implant: { label: "Implant", color: "#14b8a6" }, // teal
};

export const PROCEDURES = [
  "Consultation",
  "Scaling & polishing",
  "Composite filling",
  "Root canal treatment",
  "Crown (PFM)",
  "Crown (Zirconia)",
  "Tooth extraction",
  "Implant placement",
  "Braces adjustment",
  "Teeth whitening",
  "X-ray (IOPA)",
];

export const COMMON_DRUGS = [
  "Amoxicillin 500mg",
  "Ibuprofen 400mg",
  "Paracetamol 650mg",
  "Metronidazole 400mg",
  "Chlorhexidine mouthwash",
  "Diclofenac 50mg",
  "Pantoprazole 40mg",
];

export const ALLERGY_OPTIONS = ["Penicillin", "Latex", "Lidocaine", "Aspirin", "Sulfa", "Iodine"];
export const CONDITION_OPTIONS = ["Diabetes", "Hypertension", "Asthma", "Pregnancy", "Bleeding disorder", "Heart disease"];

const seedProviders: Provider[] = [
  { id: "dr-1", name: "Dr. Anjali Mehta", specialty: "Endodontist", reg: "MDS-22481", color: "1" },
  { id: "dr-2", name: "Dr. Vikram Rao", specialty: "Orthodontist", reg: "MDS-19034", color: "2" },
  { id: "dr-3", name: "Dr. Sara Khan", specialty: "General Dentist", reg: "BDS-30912", color: "4" },
];

// Mutable singleton so newly added doctors survive across requests in dev.
const gp = globalThis as unknown as { __clinicProviders?: Provider[] };
if (!gp.__clinicProviders) gp.__clinicProviders = seedProviders.map((p) => ({ ...p }));
export const providers = gp.__clinicProviders;

export const DENTAL_SPECIALTIES = [
  "General Dentist",
  "Endodontist",
  "Orthodontist",
  "Periodontist",
  "Prosthodontist",
  "Oral Surgeon",
  "Pedodontist",
  "Implantologist",
];

export function addProvider(input: Partial<Provider>): Provider {
  const next: Provider = {
    id: `dr-${Date.now()}`,
    name: input.name?.trim() || "New Doctor",
    specialty: input.specialty?.trim() || "General Dentist",
    reg: input.reg?.trim() || "—",
    color: input.color || String((providers.length % 5) + 1),
  };
  providers.push(next);
  return next;
}

const T = new Date("2026-06-04T00:00:00Z").getTime();
const at = (h: number, m: number) => new Date(T + (h * 60 + m) * 60000).toISOString();
const daysAgo = (d: number) => new Date(T - d * 86400000).toISOString();
// y, 1-based month, day → ISO. Used to spread demo data across months & FYs.
const day = (y: number, m: number, d: number, h = 10, mi = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, mi)).toISOString();

const seedPatients: Patient[] = [
  {
    id: "pat-1", name: "Rohan Sharma", dob: "1990-04-12", anniversary: "2016-06-12", gender: "M", phone: "+91 98200 11223",
    email: "rohan.s@example.com", bloodGroup: "B+", abhaId: "12-3456-7890-1234",
    allergies: ["Penicillin"], conditions: ["Diabetes"], balance: 0, lastVisit: daysAgo(14), emoji: "🧑🏽",
    toothFindings: { 16: "caries", 26: "filled", 36: "rct", 46: "crown" },
    treatmentPlan: [
      { id: "tp-1", tooth: 16, procedure: "Composite filling", phase: 1, estimate: 45, status: "planned" },
      { id: "tp-2", tooth: 36, procedure: "Crown (Zirconia)", phase: 2, estimate: 180, status: "planned" },
    ],
  },
  {
    id: "pat-2", name: "Priya Nair", dob: "1985-06-18", anniversary: "2011-07-05", gender: "F", phone: "+91 99876 55440",
    email: "priya.nair@example.com", bloodGroup: "O+", gstin: "29AABCW1234M1Z7", allergies: ["Latex", "Lidocaine"], conditions: ["Hypertension"],
    balance: 120, lastVisit: daysAgo(3), emoji: "👩🏽",
    toothFindings: { 11: "crown", 21: "crown", 47: "missing", 48: "implant" },
    treatmentPlan: [{ id: "tp-3", tooth: 47, procedure: "Implant placement", phase: 1, estimate: 520, status: "in-progress" }],
  },
  {
    id: "pat-3", name: "Aarav Gupta", dob: "2014-07-08", gender: "M", phone: "+91 90011 22334",
    email: "guptafamily@example.com", bloodGroup: "A+", allergies: [], conditions: [], balance: 0, lastVisit: daysAgo(30), emoji: "👦🏽",
    toothFindings: { 55: "caries", 65: "caries" }, treatmentPlan: [],
  },
  {
    id: "pat-4", name: "Meera Krishnan", dob: "1978-02-19", anniversary: "2002-06-25", gender: "F", phone: "+91 98450 99887",
    email: "meera.k@example.com", bloodGroup: "AB+", allergies: ["Aspirin"], conditions: ["Asthma"], balance: 65, lastVisit: daysAgo(1), emoji: "👩🏾",
    toothFindings: { 36: "caries", 37: "filled" }, treatmentPlan: [{ id: "tp-4", tooth: 36, procedure: "Root canal treatment", phase: 1, estimate: 160, status: "planned" }],
  },
  {
    id: "pat-5", name: "Imran Sheikh", dob: "1995-09-25", gender: "M", phone: "+91 97000 44556",
    email: "imran.s@example.com", bloodGroup: "B-", allergies: [], conditions: [], balance: 0, lastVisit: daysAgo(7), emoji: "🧔🏽",
    toothFindings: { 18: "missing", 28: "missing" }, treatmentPlan: [],
  },
  {
    id: "pat-6", name: "Kavya Reddy", dob: "2001-12-03", gender: "F", phone: "+91 96322 78900",
    email: "kavya.r@example.com", bloodGroup: "O-", allergies: ["Sulfa"], conditions: ["Pregnancy"], balance: 40, lastVisit: daysAgo(2), emoji: "👩🏻",
    toothFindings: { 13: "caries" }, treatmentPlan: [{ id: "tp-5", tooth: 13, procedure: "Composite filling", phase: 1, estimate: 45, status: "planned" }],
  },
  {
    id: "pat-7", name: "Sanjay Patel", dob: "1968-06-15", anniversary: "1996-06-09", gender: "M", phone: "+91 99090 12121",
    email: "sanjay.p@example.com", bloodGroup: "A-", gstin: "29AAQCS8899R1Z2", allergies: [], conditions: ["Heart disease", "Hypertension"], balance: 0, lastVisit: daysAgo(21), emoji: "👴🏽",
    toothFindings: { 46: "rct", 47: "crown", 11: "filled" }, treatmentPlan: [],
  },
  {
    id: "pat-8", name: "Neha Joshi", dob: "1992-06-08", anniversary: "2018-06-20", gender: "F", phone: "+91 98330 45567",
    email: "neha.j@example.com", bloodGroup: "O+", allergies: [], conditions: [], balance: 90, lastVisit: daysAgo(9), emoji: "👩🏼",
    toothFindings: { 24: "caries", 25: "filled" }, treatmentPlan: [{ id: "tp-6", tooth: 24, procedure: "Composite filling", phase: 1, estimate: 45, status: "planned" }],
  },
  {
    id: "pat-9", name: "Arjun Menon", dob: "1988-03-22", gender: "M", phone: "+91 97411 22890",
    email: "arjun.m@example.com", bloodGroup: "B+", allergies: [], conditions: [], balance: 0, lastVisit: daysAgo(45), emoji: "🧑🏽",
    toothFindings: { 38: "missing" }, treatmentPlan: [],
  },
  {
    id: "pat-10", name: "Fatima Khan", dob: "1999-11-14", gender: "F", phone: "+91 96500 33221",
    email: "fatima.k@example.com", bloodGroup: "AB-", allergies: ["Penicillin"], conditions: [], balance: 150, lastVisit: daysAgo(5), emoji: "🧕🏽",
    toothFindings: { 16: "rct", 17: "crown" }, treatmentPlan: [{ id: "tp-7", tooth: 16, procedure: "Crown (PFM)", phase: 1, estimate: 150, status: "in-progress" }],
  },
  {
    id: "pat-11", name: "Vivek Iyer", dob: "1975-06-30", anniversary: "2003-12-12", gender: "M", phone: "+91 99860 77654",
    email: "vivek.i@example.com", bloodGroup: "A+", allergies: [], conditions: ["Diabetes"], balance: 0, lastVisit: daysAgo(60), emoji: "👨🏽",
    toothFindings: { 26: "filled", 36: "filled" }, treatmentPlan: [],
  },
  {
    id: "pat-12", name: "Ananya Das", dob: "2010-05-19", gender: "F", phone: "+91 90077 88665",
    email: "dasfamily@example.com", bloodGroup: "O+", allergies: [], conditions: [], balance: 0, lastVisit: daysAgo(18), emoji: "👧🏽",
    toothFindings: { 75: "caries" }, treatmentPlan: [],
  },
  {
    id: "pat-13", name: "Rahul Verma", dob: "1983-09-09", gender: "M", phone: "+91 98201 55443",
    email: "rahul.v@example.com", bloodGroup: "B-", allergies: [], conditions: [], balance: 220, lastVisit: daysAgo(11), emoji: "🧑🏻",
    toothFindings: { 46: "caries", 47: "caries", 48: "missing" },
    treatmentPlan: [{ id: "tp-8", tooth: 46, procedure: "Root canal treatment", phase: 1, estimate: 160, status: "planned" }],
  },
  {
    id: "pat-14", name: "Sneha Pillai", dob: "1996-06-25", gender: "F", phone: "+91 97300 99012",
    email: "sneha.p@example.com", bloodGroup: "AB+", allergies: [], conditions: [], balance: 0, lastVisit: daysAgo(33), emoji: "👩🏽",
    toothFindings: { 21: "filled" }, treatmentPlan: [],
  },
  {
    id: "pat-15", name: "Mohammed Ali", dob: "1970-01-30", gender: "M", phone: "+91 96000 11447",
    email: "m.ali@example.com", bloodGroup: "A-", allergies: [], conditions: ["Hypertension", "Heart disease"], balance: 75, lastVisit: daysAgo(6), emoji: "🧔🏾",
    toothFindings: { 11: "crown", 21: "crown", 36: "rct" }, treatmentPlan: [],
  },
  {
    id: "pat-16", name: "Divya Rao", dob: "2003-07-02", gender: "F", phone: "+91 90088 22113",
    email: "divya.r@example.com", bloodGroup: "O+", allergies: ["Latex"], conditions: [], balance: 0, lastVisit: daysAgo(25), emoji: "👩🏻",
    toothFindings: { 14: "caries" }, treatmentPlan: [{ id: "tp-9", tooth: 14, procedure: "Composite filling", phase: 1, estimate: 45, status: "planned" }],
  },
];

// today's operational schedule (drives the live queue / board)
const todaysAppointments: Appointment[] = [
  { id: "ap-1", patientId: "pat-2", providerId: "dr-1", start: at(9, 0), durationMin: 30, type: "in-clinic", status: "completed", reason: "Implant review", chair: "Chair 1" },
  { id: "ap-2", patientId: "pat-4", providerId: "dr-1", start: at(9, 30), durationMin: 45, type: "in-clinic", status: "in-consult", reason: "RCT pain", chair: "Chair 1" },
  { id: "ap-3", patientId: "pat-6", providerId: "dr-3", start: at(10, 0), durationMin: 30, type: "in-clinic", status: "arrived", reason: "Filling", chair: "Chair 2" },
  { id: "ap-4", patientId: "pat-1", providerId: "dr-3", start: at(10, 30), durationMin: 30, type: "in-clinic", status: "booked", reason: "Caries check-up", chair: "Chair 2" },
  { id: "ap-5", patientId: "pat-5", providerId: "dr-2", start: at(11, 0), durationMin: 20, type: "video", status: "booked", reason: "Braces consult", chair: "Tele" },
  { id: "ap-6", patientId: "pat-3", providerId: "dr-3", start: at(11, 30), durationMin: 30, type: "in-clinic", status: "no-show", reason: "Milk-tooth caries", chair: "Chair 2" },
  { id: "ap-7", patientId: "pat-7", providerId: "dr-1", start: at(12, 0), durationMin: 30, type: "in-clinic", status: "booked", reason: "Crown fitting", chair: "Chair 1" },
];

// historical visits spread across months & both financial years (FY25-26 & FY26-27)
const HIST: [string, string, string, string, Appointment["type"], number][] = [
  // patientId, providerId, dateISO, reason, type, durationMin
  ["pat-1", "dr-3", day(2025, 5, 14), "Scaling & polishing", "in-clinic", 30],
  ["pat-9", "dr-1", day(2025, 7, 3), "Wisdom tooth review", "in-clinic", 30],
  ["pat-11", "dr-1", day(2025, 8, 21), "RCT 26", "in-clinic", 60],
  ["pat-13", "dr-2", day(2025, 9, 9), "Braces adjustment", "in-clinic", 30],
  ["pat-7", "dr-1", day(2025, 10, 17), "Crown fitting", "in-clinic", 45],
  ["pat-10", "dr-1", day(2025, 11, 5), "Crown prep 16", "in-clinic", 60],
  ["pat-15", "dr-3", day(2025, 12, 12), "Routine check-up", "in-clinic", 20],
  ["pat-4", "dr-1", day(2026, 1, 8), "RCT 36 session 1", "in-clinic", 60],
  ["pat-14", "dr-3", day(2026, 2, 19), "Teeth whitening", "in-clinic", 60],
  ["pat-8", "dr-3", day(2026, 3, 3), "Composite filling 24", "in-clinic", 30],
  ["pat-16", "dr-2", day(2026, 3, 28), "Ortho consult", "video", 20],
  // FY26-27
  ["pat-2", "dr-1", day(2026, 4, 12), "Implant placement", "in-clinic", 90],
  ["pat-12", "dr-3", day(2026, 4, 22), "Milk-tooth filling", "in-clinic", 30],
  ["pat-13", "dr-2", day(2026, 5, 6), "Braces adjustment", "in-clinic", 30],
  ["pat-10", "dr-1", day(2026, 5, 20), "Crown cementation", "in-clinic", 45],
  ["pat-1", "dr-3", day(2026, 5, 27), "Scaling & polishing", "in-clinic", 30],
];
const histAppointments: Appointment[] = HIST.map(([patientId, providerId, date, reason, type, durationMin], i) => ({
  id: `aph-${i + 1}`,
  patientId,
  providerId,
  start: date,
  durationMin,
  type,
  status: "completed",
  reason,
  chair: type === "video" ? "Tele" : `Chair ${(i % 3) + 1}`,
}));

const seedAppointments: Appointment[] = [...todaysAppointments, ...histAppointments];

const seedPrescriptions: Prescription[] = [
  {
    id: "rx-1", patientId: "pat-2", providerId: "dr-1", date: daysAgo(3),
    items: [
      { drug: "Amoxicillin 500mg", dosage: "1 tab", frequency: "TID (3x/day)", duration: "5 days", notes: "After meals" },
      { drug: "Ibuprofen 400mg", dosage: "1 tab", frequency: "BID (2x/day)", duration: "3 days", notes: "For pain" },
    ],
  },
  {
    id: "rx-2", patientId: "pat-4", providerId: "dr-1", date: daysAgo(1),
    items: [{ drug: "Chlorhexidine mouthwash", dosage: "10 ml rinse", frequency: "BID (2x/day)", duration: "7 days" }],
  },
  {
    id: "rx-3", patientId: "pat-10", providerId: "dr-1", date: daysAgo(5),
    items: [
      { drug: "Amoxicillin 500mg", dosage: "1 tab", frequency: "TID (3x/day)", duration: "5 days" },
      { drug: "Paracetamol 650mg", dosage: "1 tab", frequency: "SOS", duration: "3 days", notes: "If pain" },
    ],
  },
  {
    id: "rx-4", patientId: "pat-13", providerId: "dr-2", date: daysAgo(11),
    items: [{ drug: "Diclofenac 50mg", dosage: "1 tab", frequency: "BID (2x/day)", duration: "3 days", notes: "After food" }],
  },
  {
    id: "rx-5", patientId: "pat-15", providerId: "dr-3", date: day(2025, 12, 12),
    items: [{ drug: "Chlorhexidine mouthwash", dosage: "10 ml rinse", frequency: "BID (2x/day)", duration: "10 days" }],
  },
];

// Invoices spread across both financial years. mkInvoice keeps ids sequential.
let invSeq = 2001;
const mkInvoice = (
  patientId: string,
  date: string,
  status: InvoiceStatus,
  mode: PayMode,
  items: { desc: string; amount: number }[]
): Invoice => ({
  id: `INV-${invSeq++}`,
  patientId,
  date,
  items,
  total: items.reduce((s, i) => s + i.amount, 0),
  status,
  mode,
});

const seedInvoices: Invoice[] = [
  // ── FY 2025-26 ──
  mkInvoice("pat-1", day(2025, 5, 14), "paid", "upi", [{ desc: "Scaling & polishing", amount: 35 }]),
  mkInvoice("pat-9", day(2025, 7, 3), "paid", "card", [{ desc: "Consultation", amount: 15 }, { desc: "X-ray (IOPA)", amount: 12 }]),
  mkInvoice("pat-11", day(2025, 8, 21), "paid", "upi", [{ desc: "Root canal treatment", amount: 160 }]),
  mkInvoice("pat-13", day(2025, 9, 9), "paid", "cash", [{ desc: "Braces adjustment", amount: 50 }]),
  mkInvoice("pat-7", day(2025, 10, 17), "paid", "card", [{ desc: "Crown (PFM)", amount: 150 }]),
  mkInvoice("pat-10", day(2025, 11, 5), "partial", "card", [{ desc: "Crown prep", amount: 90 }, { desc: "X-ray (IOPA)", amount: 12 }]),
  mkInvoice("pat-15", day(2025, 12, 12), "paid", "upi", [{ desc: "Routine check-up", amount: 15 }, { desc: "Scaling & polishing", amount: 35 }]),
  mkInvoice("pat-4", day(2026, 1, 8), "paid", "upi", [{ desc: "RCT (session 1)", amount: 80 }]),
  mkInvoice("pat-14", day(2026, 2, 19), "paid", "online", [{ desc: "Teeth whitening", amount: 120 }]),
  mkInvoice("pat-8", day(2026, 3, 3), "paid", "upi", [{ desc: "Composite filling", amount: 45 }]),
  mkInvoice("pat-16", day(2026, 3, 28), "due", "cash", [{ desc: "Ortho consult", amount: 20 }]),
  // ── FY 2026-27 ──
  mkInvoice("pat-2", day(2026, 4, 12), "paid", "card", [{ desc: "Implant placement", amount: 520 }]),
  mkInvoice("pat-12", day(2026, 4, 22), "paid", "cash", [{ desc: "Milk-tooth filling", amount: 30 }]),
  mkInvoice("pat-13", day(2026, 5, 6), "partial", "card", [{ desc: "Braces adjustment", amount: 50 }]),
  mkInvoice("pat-10", day(2026, 5, 20), "paid", "upi", [{ desc: "Crown cementation", amount: 60 }]),
  mkInvoice("pat-1", day(2026, 5, 27), "paid", "upi", [{ desc: "Scaling & polishing", amount: 35 }]),
  mkInvoice("pat-15", day(2026, 5, 30), "due", "cash", [{ desc: "Consultation", amount: 15 }, { desc: "X-ray (IOPA)", amount: 60 }]),
  // ── this month (June 2026) ──
  mkInvoice("pat-2", daysAgo(3), "paid", "upi", [{ desc: "Implant review", amount: 30 }, { desc: "X-ray (IOPA)", amount: 12 }]),
  mkInvoice("pat-4", daysAgo(1), "partial", "card", [{ desc: "RCT (session 2)", amount: 80 }]),
  mkInvoice("pat-6", daysAgo(2), "due", "cash", [{ desc: "Consultation", amount: 15 }, { desc: "Composite filling", amount: 45 }]),
  mkInvoice("pat-8", daysAgo(9), "due", "upi", [{ desc: "Composite filling", amount: 45 }, { desc: "Consultation", amount: 45 }]),
  mkInvoice("pat-10", daysAgo(5), "due", "card", [{ desc: "Crown (PFM) balance", amount: 60 }, { desc: "X-ray", amount: 90 }]),
];

const seedVisits: Visit[] = [
  { id: "v-1", patientId: "pat-2", providerId: "dr-1", date: daysAgo(3), complaint: "Pain near implant site", notes: "Healing well. Advised soft diet. Rx antibiotics." },
  { id: "v-2", patientId: "pat-2", providerId: "dr-1", date: day(2026, 4, 12), complaint: "Implant placement", notes: "Implant 47 placed under LA. Sutures given." },
  { id: "v-3", patientId: "pat-4", providerId: "dr-1", date: daysAgo(1), complaint: "Severe pain LL6", notes: "Diagnosed irreversible pulpitis 36. Started RCT." },
  { id: "v-4", patientId: "pat-10", providerId: "dr-1", date: daysAgo(5), complaint: "Crown 16 cementation", notes: "PFM crown cemented. Bite checked." },
  { id: "v-5", patientId: "pat-13", providerId: "dr-2", date: daysAgo(11), complaint: "Ortho tightening", notes: "Wire changed. Next review 4 weeks." },
];

// ---- in-memory singleton ----
interface ClinicDb {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  visits: Visit[];
}
const g = globalThis as unknown as { __clinic?: ClinicDb };
if (!g.__clinic) {
  g.__clinic = {
    patients: seedPatients.map((p) => ({ ...p })),
    appointments: seedAppointments.map((a) => ({ ...a })),
    prescriptions: seedPrescriptions.map((r) => ({ ...r })),
    invoices: seedInvoices.map((i) => ({ ...i })),
    visits: seedVisits.map((v) => ({ ...v })),
  };
}
const db = g.__clinic;

export const ageFromDob = (dob: string) =>
  Math.max(0, Math.floor((T - new Date(dob).getTime()) / (365.25 * 86400000)));

export const providerById = (id: string) => providers.find((p) => p.id === id);

export function listPatients() {
  return db.patients;
}
export function getPatient(id: string) {
  return db.patients.find((p) => p.id === id) ?? null;
}
export function upsertPatient(input: Partial<Patient> & { id?: string }) {
  if (input.id) {
    const idx = db.patients.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      db.patients[idx] = { ...db.patients[idx], ...input } as Patient;
      return db.patients[idx];
    }
  }
  const next: Patient = {
    id: `pat-${Date.now()}`,
    name: input.name ?? "New Patient",
    dob: input.dob ?? "1990-01-01",
    anniversary: input.anniversary,
    gender: input.gender ?? "Other",
    phone: input.phone ?? "",
    email: input.email ?? "",
    bloodGroup: input.bloodGroup ?? "—",
    abhaId: input.abhaId,
    gstin: input.gstin,
    allergies: input.allergies ?? [],
    conditions: input.conditions ?? [],
    balance: input.balance ?? 0,
    lastVisit: input.lastVisit ?? new Date(T).toISOString(),
    emoji: input.emoji ?? "🧑",
    toothFindings: input.toothFindings ?? {},
    treatmentPlan: input.treatmentPlan ?? [],
  };
  db.patients.unshift(next);
  return next;
}

export function listAppointments() {
  return [...db.appointments].sort((a, b) => a.start.localeCompare(b.start));
}
export function setApptStatus(id: string, status: ApptStatus) {
  const a = db.appointments.find((x) => x.id === id);
  if (a) a.status = status;
  return a ?? null;
}
export function updateAppointment(id: string, patch: Partial<Appointment>) {
  const a = db.appointments.find((x) => x.id === id);
  if (!a) return null;
  const fields: (keyof Appointment)[] = [
    "start",
    "durationMin",
    "chair",
    "status",
    "reason",
    "type",
    "providerId",
  ];
  fields.forEach((k) => {
    if (patch[k] !== undefined) (a[k] as Appointment[typeof k]) = patch[k] as Appointment[typeof k];
  });
  return a;
}
export function addAppointment(input: Partial<Appointment>) {
  const next: Appointment = {
    id: `ap-${Date.now()}`,
    patientId: input.patientId ?? "",
    providerId: input.providerId ?? providers[0].id,
    start: input.start ?? new Date(T).toISOString(),
    durationMin: input.durationMin ?? 30,
    type: input.type ?? "in-clinic",
    status: input.status ?? "arrived",
    reason: input.reason ?? "Walk-in",
    chair: input.chair ?? "Chair 1",
  };
  db.appointments.push(next);
  return next;
}

export function prescriptionsFor(patientId: string) {
  return db.prescriptions.filter((r) => r.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
}
export function getPrescriptionById(id: string) {
  return db.prescriptions.find((r) => r.id === id) ?? null;
}
export function addPrescription(input: Omit<Prescription, "id">) {
  const next: Prescription = { ...input, id: `rx-${Date.now()}` };
  db.prescriptions.unshift(next);
  return next;
}

export function invoicesFor(patientId: string) {
  return db.invoices.filter((i) => i.patientId === patientId);
}
export function listInvoices() {
  return [...db.invoices].sort((a, b) => b.date.localeCompare(a.date));
}
export function getInvoiceById(id: string) {
  return db.invoices.find((i) => i.id === id) ?? null;
}
export function addInvoice(input: {
  patientId: string;
  items: { desc: string; amount: number }[];
  status: InvoiceStatus;
  mode: Invoice["mode"];
  date?: string;
  rxId?: string;
}) {
  const items = input.items.filter((i) => i.desc.trim() && i.amount !== 0);
  const total = items.reduce((s, i) => s + i.amount, 0);
  const seq = 2045 + db.invoices.length;
  const next: Invoice = {
    id: `INV-${seq}`,
    patientId: input.patientId,
    date: input.date ?? new Date(T).toISOString(),
    items,
    total,
    status: input.status,
    mode: input.mode,
    rxId: input.rxId,
  };
  db.invoices.unshift(next);
  // unpaid invoices add to the patient's outstanding balance
  const p = db.patients.find((x) => x.id === input.patientId);
  if (p) {
    if (input.status === "due") p.balance += total;
    else if (input.status === "partial") p.balance += total / 2;
  }
  return next;
}
export function recordPayment(
  id: string,
  input: { amount: number; mode: PayMode; reference?: string }
) {
  const inv = db.invoices.find((i) => i.id === id);
  if (!inv) return null;
  const paidBefore = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outstandingBefore = Math.max(0, inv.total - paidBefore);
  const amount = Math.max(0, input.amount);
  inv.payments = [
    ...(inv.payments ?? []),
    { amount, mode: input.mode, reference: input.reference?.trim() || undefined, date: new Date(T).toISOString() },
  ];
  inv.mode = input.mode;
  const paidAfter = paidBefore + amount;
  inv.status = paidAfter >= inv.total - 0.01 ? "paid" : paidAfter > 0 ? "partial" : "due";
  // reduce the patient's outstanding balance by what was actually applied
  const p = db.patients.find((x) => x.id === inv.patientId);
  if (p) p.balance = Math.max(0, p.balance - Math.min(amount, outstandingBefore));
  return inv;
}

export function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const inv = db.invoices.find((i) => i.id === id);
  if (!inv) return null;
  const p = db.patients.find((x) => x.id === inv.patientId);
  if (p) {
    // reverse the previous outstanding contribution, then apply the new one
    const prevDue = inv.status === "due" ? inv.total : inv.status === "partial" ? inv.total / 2 : 0;
    const nextDue = status === "due" ? inv.total : status === "partial" ? inv.total / 2 : 0;
    p.balance = Math.max(0, p.balance - prevDue + nextDue);
  }
  inv.status = status;
  return inv;
}

export function visitsFor(patientId: string) {
  return db.visits.filter((v) => v.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
}
export function getVisitById(id: string) {
  return db.visits.find((v) => v.id === id) ?? null;
}

export interface Celebration {
  patientId: string;
  name: string;
  emoji: string;
  type: "birthday" | "anniversary";
  date: string; // this/next occurrence ISO
  inDays: number;
  years: number; // age turning / years married
}

export function upcomingCelebrations(days = 45): Celebration[] {
  const todayFloor = Date.UTC(
    new Date(T).getUTCFullYear(),
    new Date(T).getUTCMonth(),
    new Date(T).getUTCDate()
  );
  const out: Celebration[] = [];
  const add = (p: Patient, type: Celebration["type"], src?: string) => {
    if (!src) return;
    const d = new Date(src);
    const mo = d.getUTCMonth();
    const day = d.getUTCDate();
    const ty = new Date(T).getUTCFullYear();
    let occ = Date.UTC(ty, mo, day);
    if (occ < todayFloor) occ = Date.UTC(ty + 1, mo, day);
    const inDays = Math.round((occ - todayFloor) / 86400000);
    if (inDays > days) return;
    out.push({
      patientId: p.id,
      name: p.name,
      emoji: p.emoji,
      type,
      date: new Date(occ).toISOString(),
      inDays,
      years: new Date(occ).getUTCFullYear() - d.getUTCFullYear(),
    });
  };
  db.patients.forEach((p) => {
    add(p, "birthday", p.dob);
    add(p, "anniversary", p.anniversary);
  });
  return out.sort((a, b) => a.inDays - b.inDays);
}

export function clinicMetrics() {
  const appts = db.appointments;
  const today = appts.length;
  const completed = appts.filter((a) => a.status === "completed").length;
  const noShow = appts.filter((a) => a.status === "no-show").length;
  const waiting = appts.filter((a) => a.status === "arrived").length;
  const revenueToday = db.invoices
    .filter((i) => i.status !== "due")
    .reduce((s, i) => s + i.total, 0);
  const outstanding = db.patients.reduce((s, p) => s + p.balance, 0);
  const noShowRate = today ? Math.round((noShow / today) * 100) : 0;
  return {
    today,
    completed,
    noShow,
    noShowRate,
    waiting,
    revenueToday,
    outstanding,
    patients: db.patients.length,
  };
}

export const TODAY_LABEL = "Thursday, 4 June 2026";
export const TODAY_ISO = new Date(T).toISOString();

// Multi-branch support. Each patient (and their appointments/invoices) belongs to
// a branch, assigned deterministically from their id so it is stable across renders.
export const CLINIC_LOCATIONS = ["Indiranagar", "Koramangala", "Whitefield"];

// Explicit branch assignment for the seeded patients so every location is
// populated for demos; unknown (runtime-added) patients fall back to a hash.
const LOCATION_OVERRIDE: Record<string, string> = {
  "pat-1": "Indiranagar", "pat-4": "Indiranagar", "pat-7": "Indiranagar", "pat-10": "Indiranagar", "pat-13": "Indiranagar", "pat-16": "Indiranagar",
  "pat-2": "Koramangala", "pat-5": "Koramangala", "pat-8": "Koramangala", "pat-11": "Koramangala", "pat-14": "Koramangala",
  "pat-3": "Whitefield", "pat-6": "Whitefield", "pat-9": "Whitefield", "pat-12": "Whitefield", "pat-15": "Whitefield",
};

export function patientLocation(id: string) {
  if (LOCATION_OVERRIDE[id]) return LOCATION_OVERRIDE[id];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CLINIC_LOCATIONS[h % CLINIC_LOCATIONS.length];
}

export interface Location {
  id: string; // stable key == branch name
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  gstin: string;
  lead: string; // lead dentist
  chairs: number;
  openHours: string;
  active: boolean;
}

const seedLocations: Location[] = [
  {
    id: "Indiranagar", name: "Indiranagar", city: "Bengaluru",
    address: "2nd Floor, Prestige Tower, 100ft Road, Indiranagar",
    phone: "+91 80 4123 9000", email: "indiranagar@ivorydental.in",
    gstin: "29ABCDE1234F1Z5", lead: "Dr. Anjali Mehta", chairs: 4,
    openHours: "Mon–Sat · 9:00 AM – 8:00 PM", active: true,
  },
  {
    id: "Koramangala", name: "Koramangala", city: "Bengaluru",
    address: "No. 14, 80 Feet Road, 4th Block, Koramangala",
    phone: "+91 80 4567 2200", email: "koramangala@ivorydental.in",
    gstin: "29ABCDE1234F2Z4", lead: "Dr. Vikram Rao", chairs: 3,
    openHours: "Mon–Sat · 10:00 AM – 9:00 PM", active: true,
  },
  {
    id: "Whitefield", name: "Whitefield", city: "Bengaluru",
    address: "Ground Floor, Phoenix MarketCity Annexe, Whitefield Main Road",
    phone: "+91 80 4890 7700", email: "whitefield@ivorydental.in",
    gstin: "29ABCDE1234F3Z3", lead: "Dr. Sara Khan", chairs: 2,
    openHours: "Mon–Sun · 9:30 AM – 7:30 PM", active: true,
  },
];

const gl = globalThis as unknown as { __clinicLocations?: Location[] };
if (!gl.__clinicLocations) gl.__clinicLocations = seedLocations.map((l) => ({ ...l }));
const locDb = gl.__clinicLocations;

export function listLocations() {
  return locDb;
}
export function getLocation(id: string) {
  return locDb.find((l) => l.id === id) ?? null;
}
export function updateLocation(id: string, patch: Partial<Location>) {
  const i = locDb.findIndex((l) => l.id === id);
  if (i < 0) return null;
  // id and name are the stable branch key — never overwritten
  locDb[i] = { ...locDb[i], ...patch, id: locDb[i].id, name: locDb[i].name };
  return locDb[i];
}
export function addLocation(input: Partial<Location> & { name?: string }): Location | null {
  const name = input.name?.trim();
  if (!name) return null;
  const id = name; // stable branch key == name, matching the seed convention
  if (locDb.some((l) => l.id.toLowerCase() === id.toLowerCase())) return null;
  const next: Location = {
    id,
    name,
    city: input.city?.trim() || "Bengaluru",
    address: input.address?.trim() || "",
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    gstin: input.gstin?.trim() || "",
    lead: input.lead?.trim() || providers[0]?.name || "",
    chairs: input.chairs ?? 1,
    openHours: input.openHours?.trim() || "Mon–Sat · 9:00 AM – 8:00 PM",
    active: input.active ?? true,
  };
  locDb.push(next);
  return next;
}

// ---- doctor leave / calendar blocks ----
export interface TimeOff {
  id: string;
  providerId: string;
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  reason: string;
  startTime?: string; // HH:MM — set for a partial-day block; absent = whole day
  endTime?: string;
}

const seedTimeOff: TimeOff[] = [
  { id: "off-1", providerId: "dr-2", from: "2026-06-10", to: "2026-06-12", reason: "Conference — Mumbai" },
];

const gto = globalThis as unknown as { __clinicTimeOff?: TimeOff[] };
if (!gto.__clinicTimeOff) gto.__clinicTimeOff = seedTimeOff.map((t) => ({ ...t }));
const timeOffDb = gto.__clinicTimeOff;

export function listTimeOff() {
  return [...timeOffDb].sort((a, b) => a.from.localeCompare(b.from));
}
export function timeOffForProvider(providerId: string) {
  return listTimeOff().filter((t) => t.providerId === providerId);
}
export function addTimeOff(input: {
  providerId: string;
  from: string;
  to?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
}): TimeOff | null {
  if (!input.providerId || !input.from) return null;
  const to = input.to && input.to >= input.from ? input.to : input.from;
  const partial = !!(input.startTime && input.endTime);
  const next: TimeOff = {
    id: `off-${Date.now()}`,
    providerId: input.providerId,
    from: input.from,
    to,
    reason: input.reason?.trim() || "Leave",
    startTime: partial ? input.startTime : undefined,
    endTime: partial ? input.endTime : undefined,
  };
  timeOffDb.push(next);
  return next;
}
export function removeTimeOff(id: string) {
  const i = timeOffDb.findIndex((t) => t.id === id);
  if (i < 0) return false;
  timeOffDb.splice(i, 1);
  return true;
}
// Is a provider away on a given date (and optionally time HH:MM)? Whole-day
// blocks match any time; partial blocks match only within their hours.
export function providerAwayOn(providerId: string, dateIso: string, time?: string): TimeOff | null {
  const day = dateIso.slice(0, 10);
  return (
    timeOffDb.find((t) => {
      if (t.providerId !== providerId) return false;
      if (!(t.from <= day && day <= t.to)) return false;
      if (!t.startTime || !t.endTime) return true; // whole day
      if (!time) return true;
      return time >= t.startTime && time < t.endTime;
    }) ?? null
  );
}
