import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, getSession } from '@/lib/auth';
import { stringify } from 'csv-stringify/sync';

export async function GET(_: Request, { params }: { params: { entity: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'OWNER') return new Response('Forbidden', { status: 403 });

  const propertyId = await getCurrentPropertyId();
  let records: Record<string, any>[] = [];

  if (params.entity === 'invoices') {
    const rows = await prisma.invoice.findMany({ where: { propertyId } });
    records = rows.map((r) => ({ id: r.id, propertyId: r.propertyId, vendorId: r.vendorId, amount: r.amount.toString(), status: r.status, invoiceDate: r.invoiceDate.toISOString(), dueDate: r.dueDate?.toISOString() || '', category: r.category, tags: r.tags.join('|'), createdAt: r.createdAt.toISOString() }));
  } else if (params.entity === 'work-orders') {
    const rows = await prisma.workOrder.findMany({ where: { propertyId } });
    records = rows.map((r) => ({ id: r.id, propertyId: r.propertyId, title: r.title, status: r.status, priority: r.priority, vendorId: r.vendorId || '', linkedAssetId: r.linkedAssetId || '', requestedBy: r.requestedBy, requestedDate: r.requestedDate.toISOString(), createdAt: r.createdAt.toISOString() }));
  } else if (params.entity === 'assets') {
    const rows = await prisma.asset.findMany({ where: { propertyId } });
    records = rows.map((r) => ({ id: r.id, propertyId: r.propertyId, name: r.name, category: r.category, location: r.location || '', installDate: r.installDate?.toISOString() || '', serialNumber: r.serialNumber || '', createdAt: r.createdAt.toISOString() }));
  } else {
    return new Response('Not found', { status: 404 });
  }

  const csv = stringify(records, { header: true });
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=${params.entity}.csv`
    }
  });
}
