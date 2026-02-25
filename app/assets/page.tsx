import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function createAsset(formData: FormData) {
  'use server';
  const propertyId = await getCurrentPropertyId();
  await prisma.asset.create({
    data: {
      propertyId,
      name: String(formData.get('name')),
      category: String(formData.get('category')),
      location: String(formData.get('location') || ''),
      notes: String(formData.get('notes') || '')
    }
  });
  revalidatePath('/assets');
}

export default async function AssetsPage() {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const assets = await prisma.asset.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1>Assets</h1>
      <div className="card">
        <h3>Create Asset</h3>
        <form action={createAsset} className="grid">
          <input name="name" placeholder="Name" required />
          <input name="category" placeholder="Category" required />
          <input name="location" placeholder="Location" />
          <textarea name="notes" placeholder="Notes" />
          <button>Create</button>
        </form>
      </div>
      <div className="card">
        <table className="table"><thead><tr><th>Name</th><th>Category</th><th>Location</th></tr></thead><tbody>
          {assets.map((a) => <tr key={a.id}><td><Link href={`/assets/${a.id}`}>{a.name}</Link></td><td>{a.category}</td><td>{a.location}</td></tr>)}
        </tbody></table>
      </div>
    </div>
  );
}
