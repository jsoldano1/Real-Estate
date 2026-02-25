import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';
import { getSession } from '@/lib/auth';

export const metadata = { title: 'Home Systems Oversight' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        {session && (
          <nav>
            <div className="inner">
              <b>HomeOps</b>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/assets">Assets</Link>
              <Link href="/maintenance">Maintenance</Link>
              <Link href="/work-orders">Work Orders</Link>
              <Link href="/vendors">Vendors</Link>
              <Link href="/invoices">Invoices</Link>
              <Link href="/documents">Documents</Link>
              <Link href="/exports">Exports</Link>
              <span style={{ marginLeft: 'auto' }} className="badge">{session.role}</span>
              <form action="/login/logout" method="post"><button>Logout</button></form>
            </div>
          </nav>
        )}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
