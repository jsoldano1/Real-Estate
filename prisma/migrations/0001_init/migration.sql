-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'OPERATOR');
CREATE TYPE "MaintenanceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM_DAYS');
CREATE TYPE "MaintenanceStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "WorkOrderPriority" AS ENUM ('EMERGENCY', 'HIGH', 'NORMAL', 'LOW');
CREATE TYPE "WorkOrderStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'COMPLETE', 'CANCELED');
CREATE TYPE "InvoiceStatus" AS ENUM ('NEW', 'APPROVED', 'PAID', 'DISPUTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "location" TEXT,
  "installDate" TIMESTAMP(3),
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Asset_propertyId_idx" ON "Asset"("propertyId");

CREATE TABLE "MaintenanceTask" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "linkedAssetId" TEXT,
  "defaultVendorId" TEXT,
  "frequencyType" "MaintenanceFrequency" NOT NULL,
  "frequencyValue" INTEGER NOT NULL,
  "nextDueDate" TIMESTAMP(3) NOT NULL,
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaintenanceTask_propertyId_nextDueDate_idx" ON "MaintenanceTask"("propertyId", "nextDueDate");

CREATE TABLE "WorkOrder" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "WorkOrderPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "WorkOrderStatus" NOT NULL DEFAULT 'NEW',
  "linkedAssetId" TEXT,
  "vendorId" TEXT,
  "requestedBy" TEXT NOT NULL,
  "requestedDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "completionDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkOrder_propertyId_status_idx" ON "WorkOrder"("propertyId", "status");

CREATE TABLE "ServiceLog" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "linkedAssetId" TEXT,
  "vendorId" TEXT,
  "serviceDate" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "laborHours" DECIMAL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vendor" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT,
  "name" TEXT NOT NULL,
  "trade" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "notes" TEXT,
  "magicUploadToken" TEXT NOT NULL,
  "magicTokenRevoked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Vendor_magicUploadToken_key" ON "Vendor"("magicUploadToken");

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "linkedAssetId" TEXT,
  "invoiceNumber" TEXT,
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL NOT NULL,
  "category" TEXT NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'NEW',
  "paidDate" TIMESTAMP(3),
  "notes" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Invoice_propertyId_status_idx" ON "Invoice"("propertyId", "status");

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "linkedType" TEXT,
  "linkedId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_propertyId_linkedType_linkedId_idx" ON "Document"("propertyId", "linkedType", "linkedId");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_defaultVendorId_fkey" FOREIGN KEY ("defaultVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
