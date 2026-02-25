import { prisma } from '@/lib/prisma';
import { getCurrentPropertyId, requireUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

async function uploadDocument(formData: FormData) {
  'use server';
  const session = await requireUser();
  const propertyId = await getCurrentPropertyId();
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;
  const { key } = await uploadFile(file);
  await prisma.document.create({
    data: {
      propertyId,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storageKey: key,
      uploadedBy: session.role === 'OWNER' ? 'owner' : 'gc',
      linkedType: String(formData.get('linkedType') || '') || null,
      linkedId: String(formData.get('linkedId') || '') || null
    }
  });
  revalidatePath('/documents');
}

export default async function DocumentsPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireUser();
  const propertyId = await getCurrentPropertyId();
  const where: any = { propertyId };
  if (searchParams.q) where.OR = [{ fileName: { contains: searchParams.q, mode: 'insensitive' } }, { linkedType: { contains: searchParams.q, mode: 'insensitive' } }];
  const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });

  return <div>
    <h1>Documents</h1>
    <div className="card"><h3>Upload + Link</h3>
      <form action={uploadDocument} className="grid">
        <input name="file" type="file" required />
        <input name="linkedType" placeholder="linked_type (asset/work_order/invoice/etc.)" />
        <input name="linkedId" placeholder="linked_id" />
        <button>Upload</button>
      </form>
    </div>
    <div className="card"><form><input name="q" placeholder="Search documents" defaultValue={searchParams.q || ''}/><button>Search</button></form></div>
    <div className="card"><table className="table"><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Linked</th></tr></thead><tbody>
      {docs.map(d => <tr key={d.id}><td>{d.fileName}</td><td>{d.mimeType}</td><td>{d.fileSize}</td><td>{d.linkedType}:{d.linkedId}</td></tr>)}
    </tbody></table></div>
  </div>;
}
