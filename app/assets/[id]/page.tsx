import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  await requireUser();
  const asset = await prisma.asset.findUnique({
    where: { id: params.id },
    include: {
      maintenanceTasks: true,
      workOrders: true,
      invoices: true
    }
  });

  if (!asset) return <p>Asset not found.</p>;

  const docs = await prisma.document.findMany({ where: { linkedType: 'asset', linkedId: asset.id } });

  return (
    <div>
      <h1>{asset.name}</h1>
      <p>{asset.category} · {asset.location || 'No location'}</p>
      <div className="grid">
        <div className="card"><h3>Maintenance Tasks</h3>{asset.maintenanceTasks.map((m) => <p key={m.id}>{m.title}</p>)}</div>
        <div className="card"><h3>Work Orders</h3>{asset.workOrders.map((w) => <p key={w.id}>{w.title} ({w.status})</p>)}</div>
        <div className="card"><h3>Invoices</h3>{asset.invoices.map((i) => <p key={i.id}>{i.invoiceNumber || i.id} ({i.status})</p>)}</div>
        <div className="card"><h3>Documents</h3>{docs.map((d) => <p key={d.id}>{d.fileName}</p>)}</div>
      </div>
    </div>
  );
}
