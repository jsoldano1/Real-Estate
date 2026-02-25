import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function createTask(formData: FormData) {
  'use server';
  const propertyId = await getCurrentPropertyId();
  await prisma.maintenanceTask.create({
    data: {
      propertyId,
      title: String(formData.get('title')),
      description: String(formData.get('description') || ''),
      frequencyType: formData.get('frequencyType') as any,
      frequencyValue: Number(formData.get('frequencyValue') || 1),
      nextDueDate: new Date(String(formData.get('nextDueDate'))),
      linkedAssetId: String(formData.get('linkedAssetId') || '') || null,
      defaultVendorId: String(formData.get('defaultVendorId') || '') || null
    }
  });
  revalidatePath('/maintenance');
}

export default async function MaintenancePage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const tab = searchParams.tab || 'overdue';
  const now = new Date();
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const where: any = { propertyId, status: 'ACTIVE' };
  if (tab === 'overdue') where.nextDueDate = { lt: now };
  if (tab === 'soon') where.nextDueDate = { gte: now, lte: soon };

  const [tasks, assets, vendors] = await Promise.all([
    prisma.maintenanceTask.findMany({ where, orderBy: { nextDueDate: 'asc' } }),
    prisma.asset.findMany({ where: { propertyId } }),
    prisma.vendor.findMany({ where: { propertyId } })
  ]);

  return <div>
    <h1>Maintenance</h1>
    <p><a href="?tab=overdue">Overdue</a> · <a href="?tab=soon">Due Soon</a> · <a href="?tab=all">All Active</a></p>
    <div className="card"><h3>Create Recurring Task</h3>
      <form action={createTask} className="grid">
        <input name="title" placeholder="Title" required />
        <textarea name="description" placeholder="Description" />
        <select name="frequencyType"><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="ANNUAL">Annual</option><option value="CUSTOM_DAYS">Custom Days</option></select>
        <input name="frequencyValue" type="number" defaultValue={1} />
        <input name="nextDueDate" type="date" required />
        <select name="linkedAssetId"><option value="">Asset (optional)</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select name="defaultVendorId"><option value="">Vendor (optional)</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
        <button>Create</button>
      </form>
    </div>
    <div className="card"><table className="table"><thead><tr><th>Title</th><th>Due</th><th>Frequency</th></tr></thead><tbody>
      {tasks.map(t => <tr key={t.id}><td>{t.title}</td><td>{t.nextDueDate.toISOString().slice(0,10)}</td><td>{t.frequencyType} / {t.frequencyValue}</td></tr>)}
      </tbody></table>
    </div>
  </div>;
}
