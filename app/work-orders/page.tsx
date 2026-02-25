import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function createWorkOrder(formData: FormData) {
  'use server';
  const user = await requireUser();
  const propertyId = await getCurrentPropertyId();
  await prisma.workOrder.create({
    data: {
      propertyId,
      title: String(formData.get('title')),
      description: String(formData.get('description') || ''),
      priority: formData.get('priority') as any,
      linkedAssetId: String(formData.get('linkedAssetId') || '') || null,
      vendorId: String(formData.get('vendorId') || '') || null,
      requestedBy: user.role === 'OWNER' ? 'owner' : 'gc',
      requestedDate: new Date(),
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null
    }
  });
  revalidatePath('/work-orders');
}

export default async function WorkOrdersPage({ searchParams }: { searchParams: { status?: string, priority?: string } }) {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const where: any = { propertyId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.priority) where.priority = searchParams.priority;

  const [orders, assets, vendors] = await Promise.all([
    prisma.workOrder.findMany({ where, include: { vendor: true, linkedAsset: true }, orderBy: { createdAt: 'desc' } }),
    prisma.asset.findMany({ where: { propertyId } }),
    prisma.vendor.findMany({ where: { propertyId } })
  ]);

  return <div>
    <h1>Work Orders</h1>
    <div className="card"><h3>Create</h3>
      <form action={createWorkOrder} className="grid">
        <input name="title" placeholder="Title" required />
        <textarea name="description" placeholder="Description" />
        <select name="priority"><option>EMERGENCY</option><option>HIGH</option><option selected>NORMAL</option><option>LOW</option></select>
        <input name="dueDate" type="date" />
        <select name="linkedAssetId"><option value="">Asset</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select name="vendorId"><option value="">Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
        <button>Create</button>
      </form>
    </div>
    <div className="card"><table className="table"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Vendor</th></tr></thead><tbody>
      {orders.map(o => <tr key={o.id}><td><Link href={`/work-orders/${o.id}`}>{o.title}</Link></td><td>{o.status}</td><td>{o.priority}</td><td>{o.vendor?.name}</td></tr>)}
    </tbody></table></div>
  </div>;
}
