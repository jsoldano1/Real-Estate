import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { currency } from '@/lib/utils';
import { getSignedDocumentUrl } from '@/lib/storage';

async function setStatus(formData: FormData) {
  'use server';
  await requireUser();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as any;
  await prisma.invoice.update({ where: { id }, data: { status, paidDate: status === 'PAID' ? new Date() : null } });
  revalidatePath(`/invoices/${id}`);
}

export default async function InvoiceDetail({ params }: { params: { id: string } }) {
  await requireUser();
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, include: { vendor: true } });
  if (!invoice) return <p>Not found</p>;
  const doc = await prisma.document.findFirst({ where: { linkedType: 'invoice', linkedId: invoice.id } });
  const signedUrl = doc ? await getSignedDocumentUrl(doc.storageKey) : null;

  return <div>
    <h1>Invoice {invoice.invoiceNumber || invoice.id}</h1>
    <p>Vendor: {invoice.vendor.name} | Amount: {currency(invoice.amount.toString())}</p>
    <p>Status: <span className="badge">{invoice.status}</span></p>
    <form action={setStatus} className="grid" style={{ maxWidth: 300 }}>
      <input name="id" type="hidden" value={invoice.id} />
      <select name="status" defaultValue={invoice.status}><option>NEW</option><option>APPROVED</option><option>PAID</option><option>DISPUTED</option></select>
      <button>Update</button>
    </form>
    <div className="card">
      <h3>Attachment</h3>
      {signedUrl ? <a href={signedUrl} target="_blank">Open Signed URL</a> : doc ? <p>Stored key: {doc.storageKey} (configure S3 for signed URL previews)</p> : <p>No document linked.</p>}
    </div>
  </div>;
}
