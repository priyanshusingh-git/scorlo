# Scorlo

Scorlo is a mobile-first academic portal for AKTU students built with Next.js, Firebase Authentication, Prisma, and Neon.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with a custom design system
- Firebase client auth + Firebase Admin session cookies
- Neon PostgreSQL + Prisma
- Admin console for users, links, students, and maintenance

## Core features

- Student login, registration, email verification, and password reset
- Student linking by roll number with DOB capture
- Student dashboard, results, profile, and personal ranks
- Snapshot caching for linked student app data
- Precomputed ranking cache for student standings
- Admin dashboard for moderation and maintenance tasks

## Commands

```bash
npm install
npm run prisma:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required setup

1. Copy `.env.example` to `.env.local`.
2. Set the Firebase web config values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. Set the Firebase Admin values:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - optional: `FIREBASE_SESSION_COOKIE_NAME`
4. Set `DATABASE_URL` to your Neon connection string.
5. Optionally set `DIRECT_URL` for Prisma CLI commands.
6. Run [docs/neon-app-schema.sql](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/neon-app-schema.sql) against the same Neon database that contains the academic tables.

## Notes

- Prisma schema: [prisma/schema.prisma](/Users/priyanshu/Downloads/AktuBot-main/scorlo/prisma/schema.prisma)
- Shared Prisma client: [lib/prisma.ts](/Users/priyanshu/Downloads/AktuBot-main/scorlo/lib/prisma.ts)
- Design tokens: [docs/scorlo-design-tokens.md](/Users/priyanshu/Downloads/AktuBot-main/scorlo/docs/scorlo-design-tokens.md)
- Academic source tables are expected to be maintained by the importer outside this app.
