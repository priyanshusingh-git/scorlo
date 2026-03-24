# Scorlo

Scorlo is a separate Next.js app scaffold for the mobile-first student experience planned on top of the AKTU ingestion pipeline.

## Included in this first pass

- App Router + TypeScript setup
- custom Scorlo design system with CSS variables and Tailwind mapping
- mobile-first student shell
- first polished screens:
  - `/login`
  - `/`
  - `/results`
  - `/rankings`
  - `/profile`
- basic PWA manifest and service worker
- Firebase client auth + Firebase Admin session cookies
- Neon-backed server query layer
- Prisma schema + generated client scaffold for app tables
- app-specific Neon schema for:
  - `app_users`
  - `student_links`
  - `data_requests`
- backend route handlers:
  - `POST /api/auth/session`
  - `DELETE /api/auth/session`
  - `GET /api/me`
  - `GET /api/dashboard`
  - `POST /api/link-student`

## Commands

```bash
npm install
npm run prisma:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required setup

1. Copy `.env.example` to `.env.local`.
2. Fill in Firebase web config values for the `NEXT_PUBLIC_*` variables.
3. Fill in Firebase Admin values:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Set `DATABASE_URL` to your Neon connection string.
5. Optionally set `DIRECT_URL` to Neon's direct connection string for Prisma CLI commands like `db pull` and `studio`.
6. Set `SCORLO_DATA_KEY` to a long random secret for DOB encryption.
7. Run the SQL in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/neon-app-schema.sql` against the same Neon database that already contains the academic tables.

## Notes

- Current data is mocked in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/lib/mock-data.ts`
- Firebase auth and Neon-backed data access are now scaffolded, but they require your real `.env.local` values to run
- Prisma is scaffolded in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/prisma/schema.prisma` and the shared client is in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/lib/prisma.ts`
- The UI system is documented in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/scorlo-design-tokens.md`
- Academic tables are expected to already exist from the importer in `/Users/priyanshu/Downloads/AktuBot-main/aktu_neon`
