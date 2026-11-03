import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return res.status(200).json({ ok: false, database: 'not_configured', error: 'DATABASE_URL is not set in Vercel' });
  }
  try {
    const sql = neon(url);
    const rows = await sql`SELECT COUNT(*)::int AS n FROM employees`;
    return res.status(200).json({ ok: true, database: 'connected', count: rows[0]?.n ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, database: 'error', error: 'Could not reach Neon. Check DATABASE_URL and that schema.sql has been run.' });
  }
}
