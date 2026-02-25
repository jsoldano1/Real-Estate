import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireOwner, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

async function createVendor(formData: FormData) {
  'use server';
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  await prisma.vendor.create({
    data: {
      propertyId,
      name: String(formData.get('name')),
      trade: String(formData.get('trade')),
      email: String(formData.get('email') || '') || null,
      phone: String(formData.get('phone') || '') || null,
      contactName: String(formData.get('contactName') || '') || null,
      notes: String(formData.get('notes') || '') || null,
      magicUploadToken: randomUUID()
    }
  });
  revalidatePath('/vendors');
}

export default async function VendorsPage() {
  const session = await requireUser();
  const propertyId = await getCurrentPropertyId();
  const vendors = await prisma.vendor.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } });
  const origin = process.env.APP_URL || 'http://localhost:3000';

  return <div>
    <h1>Vendors</h1>
    <div className="card"><h3>Create/Edit Vendor</h3>
      <form action={createVendor} className="grid">
        <input name="name" placeholder="Name" required />
        <input name="trade" placeholder="Trade" required />
        <input name="contactName" placeholder="Contact" />
        <input name="email" type="email" placeholder="Email" />
        <input name="phone" placeholder="Phone" />
        <textarea name="notes" placeholder="Notes" />
        <button>Save</button>
      </form>
    </div>
    <div className="card"><table className="table"><thead><tr><th>Name</th><th>Trade</th><th>Magic Upload Link</th></tr></thead><tbody>
      {vendors.map(v => <tr key={v.id}><td><Link href={`/vendors/${v.id}`}>{v.name}</Link></td><td>{v.trade}</td><td><code>{origin}/v/{v.magicUploadToken}</code></td></tr>)}
    </tbody></table></div>
    {session.role === 'OWNER' ? <p>Owner can rotate/revoke tokens in vendor detail.</p> : null}
  </div>;
}

export async function rotateToken(vendorId: string) {
  'use server';
  await requireOwner();
  await prisma.vendor.update({ where: { id: vendorId }, data: { magicUploadToken: randomUUID(), magicTokenRevoked: false } });
  revalidatePath(`/vendors/${vendorId}`);
}

export async function revokeToken(vendorId: string) {
  'use server';
  await requireOwner();
  await prisma.vendor.update({ where: { id: vendorId }, data: { magicTokenRevoked: true } });
  revalidatePath(`/vendors/${vendorId}`);
}
