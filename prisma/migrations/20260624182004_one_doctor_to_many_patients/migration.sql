-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "doctorId" INTEGER;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "deactivatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Patient_doctorId_idx" ON "Patient"("doctorId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
