/*
  Warnings:

  - You are about to drop the column `tenantId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `CashLedgerEntry` table. All the data in the column will be lost.
  - The primary key for the `ComplianceRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `docKey` on the `ComplianceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `ComplianceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `CreditLedgerEntry` table. All the data in the column will be lost.
  - The primary key for the `FiledReturn3B` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `FiledReturn3B` table. All the data in the column will be lost.
  - The primary key for the `Gstr1Filing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `Gstr1Filing` table. All the data in the column will be lost.
  - The primary key for the `Invoice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `JobWorkChallan` table. All the data in the column will be lost.
  - The primary key for the `Location` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `Location` table. All the data in the column will be lost.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Provider` table. All the data in the column will be lost.
  - The primary key for the `PurchaseOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `RcmInwardSupply` table. All the data in the column will be lost.
  - The primary key for the `Rfq` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tenantId` on the `Rfq` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `VendorInvite` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Visit` table. All the data in the column will be lost.
  - The primary key for the `_RfqInvitedVendors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TenantInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CashLedgerEntry" DROP CONSTRAINT "CashLedgerEntry_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceRecord" DROP CONSTRAINT "ComplianceRecord_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceTrailEvent" DROP CONSTRAINT "ComplianceTrailEvent_recordId_fkey";

-- DropForeignKey
ALTER TABLE "CreditLedgerEntry" DROP CONSTRAINT "CreditLedgerEntry_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "FiledReturn3B" DROP CONSTRAINT "FiledReturn3B_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceipt" DROP CONSTRAINT "GoodsReceipt_poId_fkey";

-- DropForeignKey
ALTER TABLE "Gstr1Filing" DROP CONSTRAINT "Gstr1Filing_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "JobWorkChallan" DROP CONSTRAINT "JobWorkChallan_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "OrderLine" DROP CONSTRAINT "OrderLine_orderId_fkey";

-- DropForeignKey
ALTER TABLE "POItem" DROP CONSTRAINT "POItem_poId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "RcmInwardSupply" DROP CONSTRAINT "RcmInwardSupply_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Rfq" DROP CONSTRAINT "Rfq_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "RfqAward" DROP CONSTRAINT "RfqAward_poId_fkey";

-- DropForeignKey
ALTER TABLE "RfqAward" DROP CONSTRAINT "RfqAward_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "RfqItem" DROP CONSTRAINT "RfqItem_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "StaffInvite" DROP CONSTRAINT "StaffInvite_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "StaffInvite" DROP CONSTRAINT "StaffInvite_roleId_fkey";

-- DropForeignKey
ALTER TABLE "StaffInvite" DROP CONSTRAINT "StaffInvite_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "TenantInvite" DROP CONSTRAINT "TenantInvite_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_providerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvite" DROP CONSTRAINT "VendorInvite_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "_RfqInvitedVendors" DROP CONSTRAINT "_RfqInvitedVendors_A_fkey";

-- DropIndex
DROP INDEX "Appointment_tenantId_idx";

-- DropIndex
DROP INDEX "CashLedgerEntry_tenantId_idx";

-- DropIndex
DROP INDEX "ComplianceRecord_tenantId_docKey_key";

-- DropIndex
DROP INDEX "ComplianceRecord_tenantId_idx";

-- DropIndex
DROP INDEX "CreditLedgerEntry_tenantId_idx";

-- DropIndex
DROP INDEX "Invoice_tenantId_idx";

-- DropIndex
DROP INDEX "JobWorkChallan_tenantId_idx";

-- DropIndex
DROP INDEX "Location_tenantId_idx";

-- DropIndex
DROP INDEX "Order_tenantId_idx";

-- DropIndex
DROP INDEX "Patient_tenantId_idx";

-- DropIndex
DROP INDEX "Prescription_tenantId_idx";

-- DropIndex
DROP INDEX "Product_tenantId_idx";

-- DropIndex
DROP INDEX "Provider_tenantId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_tenantId_idx";

-- DropIndex
DROP INDEX "RcmInwardSupply_tenantId_idx";

-- DropIndex
DROP INDEX "Rfq_tenantId_idx";

-- DropIndex
DROP INDEX "Supplier_tenantId_idx";

-- DropIndex
DROP INDEX "Vendor_tenantId_idx";

-- DropIndex
DROP INDEX "VendorInvite_tenantId_idx";

-- DropIndex
DROP INDEX "Visit_tenantId_idx";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "CashLedgerEntry" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "ComplianceRecord" DROP CONSTRAINT "ComplianceRecord_pkey",
DROP COLUMN "docKey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ComplianceRecord_id_seq";

-- AlterTable
ALTER TABLE "ComplianceTrailEvent" ALTER COLUMN "recordId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CreditLedgerEntry" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "FiledReturn3B" DROP CONSTRAINT "FiledReturn3B_pkey",
DROP COLUMN "tenantId",
ADD CONSTRAINT "FiledReturn3B_pkey" PRIMARY KEY ("period");

-- AlterTable
ALTER TABLE "GoodsReceipt" ALTER COLUMN "poId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Gstr1Filing" DROP CONSTRAINT "Gstr1Filing_pkey",
DROP COLUMN "tenantId",
ADD CONSTRAINT "Gstr1Filing_pkey" PRIMARY KEY ("period");

-- AlterTable
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_pkey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Invoice_id_seq";

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "invoiceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "JobWorkChallan" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Location" DROP CONSTRAINT "Location_pkey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Location_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Location_id_seq";

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Order_id_seq";

-- AlterTable
ALTER TABLE "OrderLine" ALTER COLUMN "orderId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "POItem" ALTER COLUMN "poId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "tenantId",
ALTER COLUMN "locationId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "invoiceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_pkey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "rfqId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PurchaseOrder_id_seq";

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "rfqId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RcmInwardSupply" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Rfq" DROP CONSTRAINT "Rfq_pkey",
DROP COLUMN "tenantId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "poId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Rfq_id_seq";

-- AlterTable
ALTER TABLE "RfqAward" ALTER COLUMN "rfqId" SET DATA TYPE TEXT,
ALTER COLUMN "poId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RfqItem" ALTER COLUMN "rfqId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "VendorInvite" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "_RfqInvitedVendors" DROP CONSTRAINT "_RfqInvitedVendors_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_RfqInvitedVendors_AB_pkey" PRIMARY KEY ("A", "B");

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "StaffInvite";

-- DropTable
DROP TABLE "Tenant";

-- DropTable
DROP TABLE "TenantInvite";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserRole";

-- DropTable
DROP TABLE "Verification";

-- DropEnum
DROP TYPE "TenantPlan";

-- DropEnum
DROP TYPE "TenantStatus";

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqItem" ADD CONSTRAINT "RfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqAward" ADD CONSTRAINT "RfqAward_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqAward" ADD CONSTRAINT "RfqAward_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POItem" ADD CONSTRAINT "POItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTrailEvent" ADD CONSTRAINT "ComplianceTrailEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ComplianceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RfqInvitedVendors" ADD CONSTRAINT "_RfqInvitedVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
