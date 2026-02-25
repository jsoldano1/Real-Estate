import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function updateStatus(formData: FormData) {
  'use server';
  await requireUser();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as any;
  await prisma.workOrder.update({ where: { id }, data: { status, completionDate: status === 'COMPLETE' ? new Date() : null } });
  revalidatePath(`/work-orders/${id}`);
}

export default async function WorkOrderDetail({ params }: { params: { id: string } }) {
  await requireUser();
  const order = await prisma.workOrder.findUnique({ where: { id: params.id }, include: { vendor: true, linkedAsset: true } });
  if (!order) return <p>Not found</p>;
  const docs = await prisma.document.findMany({ where: { linkedType: 'work_order', linkedId: order.id } });

  return <div>
    <h1>{order.title}</h1>
    <p>{order.description}</p>
    <p>Asset: {order.linkedAsset?.name || 'N/A'} | Vendor: {order.vendor?.name || 'N/A'}</p>
    <form action={updateStatus} className="card">
      <input name="id" type="hidden" value={order.id} />
      <select name="status" defaultValue={order.status}>
        <option>NEW</option><option>ASSIGNED</option><option>IN_PROGRESS</option><option>WAITING</option><option>COMPLETE</option><option>CANCELED</option>
      </select>
      <button>Update Status</button>
    </form>
    <div className="card"><h3>Attachments</h3>{docs.map(d => <p key={d.id}>{d.fileName}</p>)}</div>
  </div>;
}
