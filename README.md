# STRATUM Power — Employer Onboarding (Vercel + Neon)

Employer / HR only onboarding tool. No employee self-service view.
The STRATUM Power logo is embedded in `public/index.html`.

## What is in this package

- `public/index.html` — the employer dashboard (employees table, Add an Employee form, Employee Record, Employer Checklist, Drive folder links, CSV export)
- `api/employees.js` — GET / POST / PUT / DELETE for employees, backed by Neon
- `api/sync.js` — POST bulk sync: replaces the Neon employees table with the table shown in the browser
- `api/health.js` — GET connection check used by the Neon status card in the app
- `schema.sql` — run once in Neon to create the `employees` table
- `package.json` — only dependency is `@neondatabase/serverless`
- `vercel.json` — serves the static frontend and the API routes
- `.env.example` — the one variable you need: `DATABASE_URL`

No database password is stored in any file in this package.

## Manual deploy on Vercel, step by step

### 1. Create the Neon database
1. Go to Neon and create a project and a database (or use an existing one).
2. Open the Neon SQL Editor for that database.
3. Paste the whole contents of `schema.sql` and run it. You should see the `employees` table created.
4. In Neon, copy the connection string. Use the pooled one if Neon offers it (it contains `-pooler`). Keep it private.

### 2. Deploy on Vercel manually
Option A — Vercel dashboard, no command line:
1. Push this folder to a GitHub / GitLab / Bitbucket repo, or use the Vercel CLI in step B.
2. In Vercel, choose Add New > Project, import that repo.
3. Framework Preset: leave it as Other / no framework. Vercel will install from `package.json` and serve `public/index.html` with the `api/` functions.
4. Before deploying, go to Project Settings > Environment Variables and add:
   - Name: `DATABASE_URL`
   - Value: your Neon connection string from step 1
   - Environment: Production (and Preview if you want previews to use the same database)
5. Deploy, then redeploy if you added the variable after the first deploy. Environment variables only take effect on a new deployment.

Option B — Vercel CLI:
1. Install the CLI once: `npm i -g vercel`
2. From inside this folder, run: `vercel`
3. Follow the prompts, then set the variable: `vercel env add DATABASE_URL production` and paste the Neon string when asked.
4. Run `vercel --prod` to deploy with the variable set.

### 3. Check the connection
1. Open your deployed site.
2. The Neon Database Connection card at the top should say Connected to Neon.
3. If it says Local only, check: the variable name is exactly `DATABASE_URL`, `schema.sql` has been run, and you redeployed after adding the variable.
4. You can also open `https://YOUR-SITE.vercel.app/api/health` in a browser. It should return `database: "connected"`.

### 4. Load and sync employees
- **Load from Neon** — pulls the employees table from Neon into the browser.
- **Sync all to Neon** — pushes the table you see in the browser to Neon, replacing what is there. Use this after adding or editing employees locally.
- Until Neon is connected, the app still works, but records save only to that browser (localStorage).

## Adding your first employee after deploy
This deployable package deliberately does not ship with any real employee's personal details in code, because a Vercel site is public by default. After deploy:
1. Use **Add an Employee** in the app to add your first hire, then click **Sync all to Neon**.
2. Or, if you prefer, insert that hire directly in the Neon SQL Editor with an `INSERT INTO employees ...` statement. Do not put personal ID or address details in a public repo.

## Protecting the site
This is an internal HR record. It contains personal details once employees are added.
- In Vercel, turn on Deployment Protection / password protection for the project, or restrict it to your team, before sharing the link.
- Do not share the deployed link with employees. This is employer / HR only.
- Do not commit a real `.env` file or a real `DATABASE_URL` to git. `.gitignore` already excludes `.env`.

## Local testing (optional)
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your real Neon string for local testing only.
3. Run `npx vercel dev` and open the local address it prints.
