import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';

export default async function DashboardPage() {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const now = new Date();
  const dueSoon = new Date();
  dueSoon.setDate(dueSoon.getDate() + 30);

  const [overdue, upcoming, openWorkOrders, newInvoices] = await Promise.all([
    prisma.maintenanceTask.count({ where: { propertyId, nextDueDate: { lt: now }, status: 'ACTIVE' } }),
    prisma.maintenanceTask.count({ where: { propertyId, nextDueDate: { gte: now, lte: dueSoon }, status: 'ACTIVE' } }),
    prisma.workOrder.count({ where: { propertyId, status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING'] } } }),
    prisma.invoice.count({ where: { propertyId, status: 'NEW' } })
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-4">
        <div className="card"><h3>Overdue Tasks</h3><p>{overdue}</p></div>
        <div className="card"><h3>Due in 30d</h3><p>{upcoming}</p></div>
        <div className="card"><h3>Open Work Orders</h3><p>{openWorkOrders}</p></div>
        <div className="card"><h3>New Invoices</h3><p>{newInvoices}</p></div>
      </div>
    </div>
  );
}
