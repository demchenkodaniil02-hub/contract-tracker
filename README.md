# Contract Tracker

This is a Next.js project built with TypeScript and Supabase. Documents are stored on Yandex Disk, while only metadata stays in Supabase.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.local.example .env.local
```

3. Fill `.env.local` with values for your project (see below).

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

The app expects the following variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
YANDEX_DISK_TOKEN=your-yandex-disk-access-token
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the client for authentication and data fetch.
- `YANDEX_DISK_TOKEN` is used by server-side API routes to upload files securely to Yandex Disk.
- `SUPABASE_SERVICE_ROLE_KEY` is used on the server for inserting and deleting `documents` metadata in Supabase.

> Do not commit `.env.local` to git. `.gitignore` already excludes `.env*`.

## Git Preparation

The repository is already configured with a proper `.gitignore` for Node/Next projects:

- `/node_modules`
- `/.next`
- `.env*`
- `.vercel`
- `*.tsbuildinfo`
- `next-env.d.ts`

If you are starting a new git repo:

```bash
git init
git add .
git commit -m "Initial project commit"
```

Then add your remote and push:

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Select the GitHub repository.
4. Set the Environment Variables in Vercel using the same names as above.
5. Use the default build command:

```bash
npm run build
```

6. Vercel will automatically deploy your app after the first push.

## Notes

- Files themselves are stored on Yandex Disk.
- Supabase only keeps metadata in the `documents` table.
- The project is ready for deployment to Vercel once environment variables are configured.
