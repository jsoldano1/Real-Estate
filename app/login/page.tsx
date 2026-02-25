import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  if (await getSession()) redirect('/dashboard');

  return (
    <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
      <h1>Login</h1>
      <form action="/api/auth/login" method="post" className="grid">
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Sign In</button>
      </form>
      <p>Seed default: owner@example.com / ChangeMe123!</p>
    </div>
  );
}
