# STRATUM Power — Employer Onboarding

Internal employer/HR onboarding tool for US and Pakistani employees. The static frontend is deployed on Vercel and all employee records are stored directly in Neon Postgres.

## What is included

- `public/index.html` — employee list, country-aware add/edit forms, onboarding checklist, Drive links, and CSV export
- `api/employees.js` — Neon-backed GET, POST, PUT, and DELETE employee API
- `schema.sql` — creates or upgrades the Neon `employees` table without deleting existing records
- `package.json` — uses `@neondatabase/serverless`
- `vercel.json` — Vercel project configuration

There are no sample employees or employee records stored in the frontend, and the app does not use browser local storage. Adds, edits, checklist changes, and deletes are written directly to Neon.

## Deploy or update

1. Open the Neon SQL Editor for the database used by this app.
2. Run the complete [`schema.sql`](schema.sql) file. It is safe to run again and migrates values from the old `father_name` and `cnic` columns.
3. In Vercel, set `DATABASE_URL` in **Project Settings → Environment Variables**. Use Neon's pooled connection string when available.
4. Deploy or redeploy this folder.

For local development:

```sh
npm install
npx vercel dev
```

The local Vercel environment also needs `DATABASE_URL`. Opening `public/index.html` directly will show the page, but database operations require the Vercel API functions.

## Country-aware fields

Selecting **Pakistan** uses NIC (CNIC), Province, and Postal code labels. Selecting **United States** uses State ID, State, ZIP code, and displays the optional SSN last-four field. Only the last four SSN digits are accepted; never enter or store a full Social Security number here.

The record also includes a phone number, employment type, emergency contact, and internal HR notes. These are common onboarding details without turning this into a full HRIS.

## Security

This application contains personal employee data. Before adding real records:

- Enable Vercel Deployment Protection or restrict the deployment to your team.
- Do not commit `.env` or a Neon connection string.
- Limit Neon access to authorized HR administrators.
- Treat CSV exports and Drive folders as sensitive HR data.
