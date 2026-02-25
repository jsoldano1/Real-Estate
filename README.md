# Home Systems Oversight Platform (v1)

Hosted-ready Next.js + TypeScript platform for owner-controlled home systems operations.

## Features
- Authoritative system of record for assets, maintenance, work orders, invoices, vendors, and documents.
- Role-based auth: `OWNER` and `OPERATOR` accounts.
- Vendor magic upload links (no account needed), with owner rotate/revoke controls.
- Dashboard for overdue maintenance, open work orders, and new invoices.
- CSV exports (Invoices, Work Orders, Assets) with stable IDs + metadata.
- Prisma + PostgreSQL schema and migration script.
- S3-compatible object storage integration with signed document URLs.

## Tech Stack
- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM

## Local Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Run Prisma migration and generate client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
4. Seed database:
   ```bash
   npm run prisma:seed
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Default Seed Data
- Property: `Home`
- Owner account: `owner@example.com / ChangeMe123!` (override via env)
- Sample vendors across trades (HVAC/plumbing/electrical)

## Environment Variables
See `.env.example` for all required keys.

Core variables:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: JWT signing secret
- `APP_URL`: Public URL for magic links

Storage variables (optional in dev):
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

If S3 vars are omitted, uploads still create metadata + storage keys (suitable for local development stubbing).

## Deployment (Cloud-ready)
1. Provision managed PostgreSQL.
2. Configure env vars in hosting platform.
3. Run migrations during deployment:
   ```bash
   npx prisma migrate deploy
   ```
4. Build and run:
   ```bash
   npm run build
   npm run start
   ```

Recommended hosts: Vercel, Render, Railway, ECS/Fargate.

## Vendor Magic Link Example
Each vendor has a tokenized URL:

```
https://your-app.example/v/<magic_upload_token>
```

Owner can rotate or revoke token from `Vendors -> Vendor Detail`.

## Security Notes
- Passwords are hashed with bcrypt.
- Auth session uses signed HTTP-only cookie.
- Signed document URLs are short-lived.
- RBAC enforced for owner-only actions (exports, token rotate/revoke).
