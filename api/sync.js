import { neon } from '@neondatabase/serverless';

// Bulk sync used by the frontend "Sync all to Neon" button.
// It replaces the whole employees table with the table shown in the browser.
// This keeps the KISS model simple: the browser table is the working copy,
// Neon is the shared record after a sync.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ error: 'DATABASE_URL is not set in Vercel. Add it in Project Settings > Environment Variables, then redeploy.' });
    const sql = neon(url);
    const employees = Array.isArray(req.body?.employees) ? req.body.employees : [];
    await sql`DELETE FROM employees`;
    for (const raw of employees) {
      const name = String(raw.name || '').trim();
      if (!name) continue;
      await sql`
        INSERT INTO employees (name, father_name, cnic, email, address, role, start_date, manager, drive_folder, progress, checks, sample)
        VALUES (
          ${name},
          ${String(raw.father || raw.father_name || '').trim() || null},
          ${String(raw.cnic || '').trim() || null},
          ${String(raw.email || '').trim() || null},
          ${String(raw.address || '').trim() || null},
          ${String(raw.role || '').trim() || null},
          ${raw.date || raw.start_date || null},
          ${String(raw.mgr || raw.manager || '').trim() || null},
          ${String(raw.drive || raw.drive_folder || '').trim() || null},
          ${Number.isFinite(Number(raw.prog ?? raw.progress)) ? Number(raw.prog ?? raw.progress) : 0},
          ${JSON.stringify(Array.isArray(raw.checks) ? raw.checks : [])},
          ${Boolean(raw.sample)}
        )`;
    }
    const count = await sql`SELECT COUNT(*)::int AS n FROM employees`;
    return res.status(200).json({ ok: true, count: count[0]?.n ?? employees.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Sync failed. Check DATABASE_URL and that schema.sql has been run.' });
  }
}
