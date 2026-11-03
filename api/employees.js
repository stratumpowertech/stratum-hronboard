import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const e = new Error('DATABASE_URL is not set in Vercel. Add it in Project Settings > Environment Variables, then redeploy.');
    e.status = 500;
    throw e;
  }
  return neon(url);
}

function rowToApi(r) {
  return {
    id: r.id,
    name: r.name,
    father_name: r.father_name,
    cnic: r.cnic,
    email: r.email,
    address: r.address,
    role: r.role,
    start_date: r.start_date,
    manager: r.manager,
    drive_folder: r.drive_folder,
    progress: r.progress,
    checks: r.checks,
    sample: r.sample,
  };
}

function clean(body = {}) {
  return {
    name: String(body.name || '').trim(),
    father_name: String(body.father_name || body.father || '').trim() || null,
    cnic: String(body.cnic || '').trim() || null,
    email: String(body.email || '').trim() || null,
    address: String(body.address || body.address || '').trim() || null,
    role: String(body.role || '').trim() || null,
    start_date: body.start_date || body.date || null,
    manager: String(body.manager || body.mgr || '').trim() || null,
    drive_folder: String(body.drive_folder || body.drive || '').trim() || null,
    progress: Number.isFinite(Number(body.progress)) ? Number(body.progress) : 0,
    checks: Array.isArray(body.checks) ? body.checks : [],
    sample: Boolean(body.sample),
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const id = req.query.id;

    if (req.method === 'GET' && !id) {
      const rows = await sql`SELECT * FROM employees ORDER BY created_at ASC`;
      return res.status(200).json(rows.map(rowToApi));
    }

    if (req.method === 'POST' && !id) {
      const e = clean(req.body);
      if (!e.name) return res.status(400).json({ error: 'name is required' });
      const rows = await sql`
        INSERT INTO employees (name, father_name, cnic, email, address, role, start_date, manager, drive_folder, progress, checks, sample)
        VALUES (${e.name}, ${e.father_name}, ${e.cnic}, ${e.email}, ${e.address}, ${e.role}, ${e.start_date}, ${e.manager}, ${e.drive_folder}, ${e.progress}, ${JSON.stringify(e.checks)}, ${e.sample})
        RETURNING *`;
      return res.status(201).json(rowToApi(rows[0]));
    }

    if (req.method === 'PUT' && id) {
      const e = clean(req.body);
      if (!e.name) return res.status(400).json({ error: 'name is required' });
      const rows = await sql`
        UPDATE employees SET
          name = ${e.name}, father_name = ${e.father_name}, cnic = ${e.cnic},
          email = ${e.email}, address = ${e.address}, role = ${e.role},
          start_date = ${e.start_date}, manager = ${e.manager},
          drive_folder = ${e.drive_folder}, progress = ${e.progress},
          checks = ${JSON.stringify(e.checks)}, sample = ${e.sample},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *`;
      if (!rows.length) return res.status(404).json({ error: 'employee not found' });
      return res.status(200).json(rowToApi(rows[0]));
    }

    if (req.method === 'DELETE' && id) {
      await sql`DELETE FROM employees WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || 'Database error. Check DATABASE_URL and that schema.sql has been run.' });
  }
}
