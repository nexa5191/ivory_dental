-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'Other');

-- CreateEnum
CREATE TYPE "ApptType" AS ENUM ('in-clinic', 'video', 'phone');

-- CreateEnum
CREATE TYPE "ApptStatus" AS ENUM ('booked', 'arrived', 'in-consult', 'completed', 'no-show');

-- CreateEnum
CREATE TYPE "ToothStatus" AS ENUM ('healthy', 'caries', 'filled', 'crown', 'rct', 'missing', 'implant');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('planned', 'in-progress', 'done');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('paid', 'due', 'partial');

-- CreateEnum
CREATE TYPE "PayMode" AS ENUM ('cash', 'card', 'upi', 'online');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('in', 'out', 'transfer', 'writeoff');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('purchase', 'sales');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'open', 'shipped', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('Consumables', 'Equipment', 'Instruments', 'Lab Services', 'Pharmacy', 'Office Supplies');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('email', 'sms', 'both');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('draft', 'sent', 'quoted', 'awarded');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('issued', 'partial', 'received', 'invoiced', 'paid', 'closed');

-- CreateEnum
CREATE TYPE "POPayMode" AS ENUM ('bank', 'upi', 'card', 'cheque', 'cash');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'registered');

-- CreateEnum
CREATE TYPE "CashEntryKind" AS ENUM ('deposit', 'settlement');

-- CreateEnum
CREATE TYPE "CreditEntryKind" AS ENUM ('accrual', 'utilisation');

-- CreateEnum
CREATE TYPE "JobWorkStatus" AS ENUM ('sent', 'received');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "chairs" INTEGER NOT NULL DEFAULT 1,
    "openHours" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "reg" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "anniversary" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'Other',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "abhaId" TEXT,
    "gstin" TEXT,
    "allergies" TEXT[],
    "conditions" TEXT[],
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastVisit" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToothFinding" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "tooth" INTEGER NOT NULL,
    "status" "ToothStatus" NOT NULL,

    CONSTRAINT "ToothFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentItem" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "tooth" INTEGER,
    "procedure" TEXT NOT NULL,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "estimate" DOUBLE PRECISION NOT NULL,
    "status" "TreatmentStatus" NOT NULL DEFAULT 'planned',
    "billed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TreatmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XrayImage" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tooth" INTEGER,
    "note" TEXT,

    CONSTRAINT "XrayImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "start" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "type" "ApptType" NOT NULL DEFAULT 'in-clinic',
    "status" "ApptStatus" NOT NULL DEFAULT 'booked',
    "reason" TEXT NOT NULL,
    "chair" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "advice" TEXT[],
    "patientName" TEXT,
    "prescriberName" TEXT,
    "signName" TEXT,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" SERIAL NOT NULL,
    "prescriptionId" INTEGER NOT NULL,
    "drug" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "complaint" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'due',
    "mode" "PayMode" NOT NULL DEFAULT 'cash',
    "rxId" INTEGER,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" "PayMode" NOT NULL,
    "reference" TEXT,
    "date" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOff" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "cost" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "MovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "ref" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "partyId" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL DEFAULT 'Consumables',
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 4,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "msme" BOOLEAN NOT NULL DEFAULT false,
    "udyam" TEXT,
    "token" TEXT NOT NULL,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "tdsSection" TEXT,
    "tdsRate" DOUBLE PRECISION,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GstRegistration" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "legalName" TEXT,
    "label" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "taxpayerType" TEXT,
    "taxpayerStatus" TEXT,

    CONSTRAINT "GstRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorInvite" (
    "token" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "createdAt" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "vendorId" INTEGER,

    CONSTRAINT "VendorInvite_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "createdAt" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'draft',
    "channel" "Channel" NOT NULL DEFAULT 'email',
    "notes" TEXT,
    "awardedVendorId" INTEGER,
    "poId" TEXT,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqItem" (
    "id" SERIAL NOT NULL,
    "rfqId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "submittedAt" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqAward" (
    "id" SERIAL NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "poId" TEXT NOT NULL,

    CONSTRAINT "RfqAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT,
    "rfqTitle" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'issued',
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "invoiceNumber" TEXT,
    "invoiceDate" TEXT,
    "invoiceAmount" DOUBLE PRECISION,
    "paymentDate" TEXT,
    "paymentMode" "POPayMode",
    "paymentReference" TEXT,
    "paymentAmount" DOUBLE PRECISION,
    "closedReason" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POItem" (
    "id" SERIAL NOT NULL,
    "poId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "POItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" SERIAL NOT NULL,
    "poId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" SERIAL NOT NULL,
    "receiptId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "free" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "gstr1Filed" BOOLEAN NOT NULL DEFAULT false,
    "gstr1Ref" TEXT,
    "gstr1Period" TEXT,
    "gstr1Held" BOOLEAN NOT NULL DEFAULT false,
    "itcClaimed" BOOLEAN NOT NULL DEFAULT false,
    "itcRef" TEXT,
    "itcPeriod" TEXT,
    "itcHeld" BOOLEAN NOT NULL DEFAULT false,
    "tdsDeposited" BOOLEAN NOT NULL DEFAULT false,
    "challanNo" TEXT,
    "tdsCertified" BOOLEAN NOT NULL DEFAULT false,
    "certNo" TEXT,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTrailEvent" (
    "id" SERIAL NOT NULL,
    "recordId" TEXT NOT NULL,
    "ts" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "ref" TEXT,

    CONSTRAINT "ComplianceTrailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gstr1Filing" (
    "period" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "Gstr1Filing_pkey" PRIMARY KEY ("period")
);

-- CreateTable
CREATE TABLE "CashLedgerEntry" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "CashEntryKind" NOT NULL,
    "ref" TEXT,
    "period" TEXT,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CashLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiledReturn3B" (
    "period" TEXT NOT NULL,
    "igst" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "FiledReturn3B_pkey" PRIMARY KEY ("period")
);

-- CreateTable
CREATE TABLE "CreditLedgerEntry" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "CreditEntryKind" NOT NULL,
    "ref" TEXT,
    "period" TEXT,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RcmInwardSupply" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "taxable" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL,
    "interState" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RcmInwardSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobWorkChallan" (
    "challanNo" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "jobWorker" TEXT NOT NULL,
    "itemSent" TEXT NOT NULL,
    "qtySent" DOUBLE PRECISION NOT NULL,
    "itemReceived" TEXT NOT NULL,
    "qtyReceived" DOUBLE PRECISION NOT NULL,
    "status" "JobWorkStatus" NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "JobWorkChallan_pkey" PRIMARY KEY ("challanNo")
);

-- CreateTable
CREATE TABLE "_RfqInvitedVendors" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RfqInvitedVendors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Patient_locationId_idx" ON "Patient"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "ToothFinding_patientId_tooth_key" ON "ToothFinding"("patientId", "tooth");

-- CreateIndex
CREATE INDEX "TreatmentItem_patientId_idx" ON "TreatmentItem"("patientId");

-- CreateIndex
CREATE INDEX "XrayImage_patientId_idx" ON "XrayImage"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_providerId_idx" ON "Appointment"("providerId");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_providerId_idx" ON "Prescription"("providerId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "Visit_patientId_idx" ON "Visit"("patientId");

-- CreateIndex
CREATE INDEX "Visit_providerId_idx" ON "Visit"("providerId");

-- CreateIndex
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");

-- CreateIndex
CREATE INDEX "Invoice_rxId_idx" ON "Invoice"("rxId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "TimeOff_providerId_idx" ON "TimeOff"("providerId");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_location_key" ON "ProductStock"("productId", "location");

-- CreateIndex
CREATE INDEX "Movement_productId_idx" ON "Movement"("productId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_productId_idx" ON "OrderLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_token_key" ON "Vendor"("token");

-- CreateIndex
CREATE INDEX "GstRegistration_vendorId_idx" ON "GstRegistration"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvite_vendorId_key" ON "VendorInvite"("vendorId");

-- CreateIndex
CREATE INDEX "RfqItem_rfqId_idx" ON "RfqItem"("rfqId");

-- CreateIndex
CREATE INDEX "Quote_rfqId_idx" ON "Quote"("rfqId");

-- CreateIndex
CREATE INDEX "Quote_vendorId_idx" ON "Quote"("vendorId");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "RfqAward_rfqId_idx" ON "RfqAward"("rfqId");

-- CreateIndex
CREATE INDEX "RfqAward_vendorId_idx" ON "RfqAward"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_rfqId_idx" ON "PurchaseOrder"("rfqId");

-- CreateIndex
CREATE INDEX "POItem_poId_idx" ON "POItem"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_poId_idx" ON "GoodsReceipt"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_receiptId_idx" ON "GoodsReceiptLine"("receiptId");

-- CreateIndex
CREATE INDEX "ComplianceTrailEvent_recordId_idx" ON "ComplianceTrailEvent"("recordId");

-- CreateIndex
CREATE INDEX "_RfqInvitedVendors_B_index" ON "_RfqInvitedVendors"("B");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothFinding" ADD CONSTRAINT "ToothFinding_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentItem" ADD CONSTRAINT "TreatmentItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XrayImage" ADD CONSTRAINT "XrayImage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_rxId_fkey" FOREIGN KEY ("rxId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GstRegistration" ADD CONSTRAINT "GstRegistration_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvite" ADD CONSTRAINT "VendorInvite_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqItem" ADD CONSTRAINT "RfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqAward" ADD CONSTRAINT "RfqAward_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqAward" ADD CONSTRAINT "RfqAward_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqAward" ADD CONSTRAINT "RfqAward_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POItem" ADD CONSTRAINT "POItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTrailEvent" ADD CONSTRAINT "ComplianceTrailEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ComplianceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RfqInvitedVendors" ADD CONSTRAINT "_RfqInvitedVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RfqInvitedVendors" ADD CONSTRAINT "_RfqInvitedVendors_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
