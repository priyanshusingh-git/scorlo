# Scorlo

Scorlo is a mobile-first academic portal for AKTU students. It combines a student workspace, a protected admin console, snapshot-based student views, precomputed rankings, and a support workflow for record issues.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Admin session cookies
- Neon PostgreSQL
- Prisma

## Product Areas

### Student app

- Sign up, log in, email verification, and password reset
- Link a student profile by roll number and date of birth
- Snapshot-backed student dashboard, results, profile, and ranks
- Support issue submission and issue status tracking
- Mobile-first navigation with installed-app support

### Admin console

- Main-admin overview and maintenance tools
- Student account and linking workflows
- Student academic record browser
- Support issue queue
- Main-admin-only admin creation and destructive controls

## Architecture Notes

- Student routes under `app/(student)` use a shared student shell.
- Linked student pages read from `student_app_snapshot_cache`.
- Rankings are precomputed into `student_rankings`.
- Support issues are stored in `support_issues`.
- Auth is based on Firebase session cookies verified on the server.

## Local Setup

```bash
npm install
npm run prisma:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

1. Copy `.env.example` to `.env.local`.
2. Set Firebase web values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. Set Firebase Admin values:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - optional: `FIREBASE_SESSION_COOKIE_NAME`
4. Set `DATABASE_URL`.
5. Optionally set `DIRECT_URL` for Prisma CLI use.

## Database Setup

Run [docs/neon-app-schema.sql](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/neon-app-schema.sql) against the same Neon database that contains the academic source tables.

Important app-managed tables include:

- `app_users`
- `student_links`
- `data_requests`
- `student_metrics`
- `student_rankings`
- `student_app_snapshot_cache`
- `admin_audit_logs`
- `support_issues`

## Admin Roles

- Main admin email: `admin@scorlo.in`
- The main admin account cannot be deleted.
- Only the main admin can:
  - create admin accounts
  - access admin account management
  - access maintenance
  - perform destructive admin/user/link actions reserved in the API
- Other admins can work with:
  - students
  - support issues
  - their own admin profile

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
```

## Documentation

- Docs index: [docs/README.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/README.md)
- Schema: [docs/neon-app-schema.sql](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/neon-app-schema.sql)
- Design tokens: [docs/scorlo-design-tokens.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/scorlo-design-tokens.md)
- Student guide: [docs/student-guide.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/student-guide.md)
- Main admin guide: [docs/main-admin-guide.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/main-admin-guide.md)
- Other admin guide: [docs/admin-guide.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/admin-guide.md)

## Deployment

Before deployment:

1. verify `.env.local` equivalents are set in the deployment environment
2. ensure Neon schema is current
3. run a fresh production build

```bash
rm -rf .next
npm run build
```

## Notes

- Academic source tables are maintained outside this app.
- Student UI is optimized around cached snapshots, not live academic joins on every route.
- Sensitive API responses are served with `no-store`.
