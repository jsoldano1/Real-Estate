import { requireOwner } from '@/lib/auth';

export default async function ExportsPage() {
  await requireOwner();
  return <div>
    <h1>Exports (CSV)</h1>
    <div className="card">
      <p><a href="/api/export/invoices">Download Invoices CSV</a></p>
      <p><a href="/api/export/work-orders">Download Work Orders CSV</a></p>
      <p><a href="/api/export/assets">Download Assets CSV</a></p>
    </div>
  </div>;
}
