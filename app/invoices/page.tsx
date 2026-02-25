import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';
import { currency } from '@/lib/utils';

export default async function InvoicesPage({ searchParams }: { searchParams: Record<string, string> }) {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const where: any = { propertyId };
  if (searchParams.vendorId) where.vendorId = searchParams.vendorId;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.minAmount || searchParams.maxAmount) where.amount = { gte: searchParams.minAmount ? Number(searchParams.minAmount) : undefined, lte: searchParams.maxAmount ? Number(searchParams.maxAmount) : undefined };
  if (searchParams.q) where.OR = [{ notes: { contains: searchParams.q, mode: 'insensitive' } }, { invoiceNumber: { contains: searchParams.q, mode: 'insensitive' } }];

  const [vendors, invoices, newQueue] = await Promise.all([
    prisma.vendor.findMany({ where: { propertyId } }),
    prisma.invoice.findMany({ where, include: { vendor: true }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.findMany({ where: { propertyId, status: 'NEW' }, include: { vendor: true }, orderBy: { createdAt: 'desc' } })
  ]);

  return <div>
    <h1>Invoices</h1>
    <div className="card"><h3>New Invoices Queue</h3>{newQueue.map(i => <p key={i.id}><Link href={`/invoices/${i.id}`}>{i.vendor.name}</Link> - {currency(i.amount.toString())}</p>)}</div>
    <div className="card"><h3>Filters</h3>
      <form className="grid">
        <input name="q" placeholder="Search notes/invoice number" defaultValue={searchParams.q || ''} />
        <select name="vendorId" defaultValue={searchParams.vendorId || ''}><option value="">Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
        <select name="status" defaultValue={searchParams.status || ''}><option value="">Status</option><option>NEW</option><option>APPROVED</option><option>PAID</option><option>DISPUTED</option></select>
        <input name="category" placeholder="Category" defaultValue={searchParams.category || ''} />
        <input name="minAmount" type="number" step="0.01" placeholder="Min amount" defaultValue={searchParams.minAmount || ''} />
        <input name="maxAmount" type="number" step="0.01" placeholder="Max amount" defaultValue={searchParams.maxAmount || ''} />
        <button>Apply</button>
      </form>
    </div>
    <div className="card"><h3>All Invoices</h3><table className="table"><thead><tr><th>ID</th><th>Vendor</th><th>Status</th><th>Amount</th><th>Due</th></tr></thead><tbody>
      {invoices.map(i => <tr key={i.id}><td><Link href={`/invoices/${i.id}`}>{i.id}</Link></td><td>{i.vendor.name}</td><td>{i.status}</td><td>{currency(i.amount.toString())}</td><td>{i.dueDate?.toISOString().slice(0,10)}</td></tr>)}
    </tbody></table></div>
  </div>;
}
