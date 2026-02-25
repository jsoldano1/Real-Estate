import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function vendorUpload(formData: FormData) {
  'use server';
  const token = String(formData.get('token'));
  const vendor = await prisma.vendor.findUnique({ where: { magicUploadToken: token } });
  if (!vendor || vendor.magicTokenRevoked) return;

  const property = vendor.propertyId ? await prisma.property.findUnique({ where: { id: vendor.propertyId } }) : await prisma.property.findFirst();
  if (!property) return;

  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;

  const { key } = await uploadFile(file);
  const invoice = await prisma.invoice.create({
    data: {
      propertyId: property.id,
      vendorId: vendor.id,
      workOrderId: String(formData.get('workOrderId') || '') || null,
      invoiceDate: new Date(String(formData.get('invoiceDate'))),
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null,
      amount: Number(formData.get('amount') || 0),
      category: 'maintenance',
      status: 'NEW',
      notes: String(formData.get('notes') || ''),
      tags: []
    }
  });

  await prisma.document.create({
    data: {
      propertyId: property.id,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storageKey: key,
      uploadedBy: 'vendor',
      linkedType: 'invoice',
      linkedId: invoice.id
    }
  });

  revalidatePath('/invoices');
  redirect(`/v/${token}?success=1`);
}

export default async function VendorUploadPage({ params, searchParams }: { params: { token: string }, searchParams: { success?: string } }) {
  const vendor = await prisma.vendor.findUnique({ where: { magicUploadToken: params.token } });
  if (!vendor || vendor.magicTokenRevoked) return <div className="card"><h1>Upload link unavailable</h1><p>This link has been revoked or is invalid.</p></div>;

  const propertyId = vendor.propertyId || (await prisma.property.findFirst())?.id;
  const workOrders = propertyId ? await prisma.workOrder.findMany({ where: { propertyId, vendorId: vendor.id }, orderBy: { createdAt: 'desc' }, take: 20 }) : [];

  return <div className="card" style={{ maxWidth: 600, margin: '2rem auto' }}>
    <h1>{vendor.name} Invoice Upload</h1>
    {searchParams.success ? <p style={{ color: 'green' }}>Invoice uploaded. Thank you.</p> : null}
    <form action={vendorUpload} className="grid">
      <input type="hidden" name="token" value={params.token} />
      <input name="file" type="file" accept="application/pdf,image/*" required />
      <input name="invoiceDate" type="date" required />
      <input name="amount" type="number" step="0.01" required />
      <input name="dueDate" type="date" />
      <select name="workOrderId"><option value="">Linked Work Order (optional)</option>{workOrders.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</select>
      <textarea name="notes" placeholder="Notes" />
      <button>Submit Invoice</button>
    </form>
  </div>;
}
