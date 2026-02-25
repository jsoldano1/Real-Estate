import { prisma } from '@/lib/prisma';
import { requireOwner, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

async function rotate(formData: FormData) {
  'use server';
  await requireOwner();
  const id = String(formData.get('id'));
  await prisma.vendor.update({ where: { id }, data: { magicUploadToken: randomUUID(), magicTokenRevoked: false } });
  revalidatePath(`/vendors/${id}`);
}

async function revoke(formData: FormData) {
  'use server';
  await requireOwner();
  const id = String(formData.get('id'));
  await prisma.vendor.update({ where: { id }, data: { magicTokenRevoked: true } });
  revalidatePath(`/vendors/${id}`);
}

export default async function VendorDetail({ params }: { params: { id: string } }) {
  const session = await requireUser();
  const vendor = await prisma.vendor.findUnique({ where: { id: params.id }, include: { invoices: true, workOrders: true } });
  if (!vendor) return <p>Not found</p>;
  const origin = process.env.APP_URL || 'http://localhost:3000';

  return <div>
    <h1>{vendor.name}</h1>
    <p>{vendor.trade} · {vendor.email || 'No email'}</p>
    <p><code>{origin}/v/{vendor.magicUploadToken}</code> {vendor.magicTokenRevoked ? '(revoked)' : ''}</p>
    {session.role === 'OWNER' && <div className="grid" style={{ maxWidth: 300 }}>
      <form action={rotate}><input type="hidden" name="id" value={vendor.id} /><button>Rotate Token</button></form>
      <form action={revoke}><input type="hidden" name="id" value={vendor.id} /><button>Revoke Token</button></form>
    </div>}
    <div className="card"><h3>Invoices</h3>{vendor.invoices.map(i => <p key={i.id}>{i.invoiceNumber || i.id} {i.status}</p>)}</div>
  </div>;
}
