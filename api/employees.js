import { neon } from '@neondatabase/serverless';

const COUNTRIES = new Set(['Pakistan', 'United States']);
const EMPLOYMENT_TYPES = new Set(['Full-time', 'Part-time', 'Contractor', 'Intern']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const error = new Error('The employee database is not configured.');
    error.status = 500;
    throw error;
  }
  return neon(url);
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function clean(body = {}) {
  const country = COUNTRIES.has(body.country) ? body.country : 'Pakistan';
  const employmentType = EMPLOYMENT_TYPES.has(body.employment_type) ? body.employment_type : null;
  const checks = Array.isArray(body.checks) ? body.checks.slice(0, 10).map(Boolean) : [];
  const ssnLastFour = country === 'United States'
    ? String(body.ssn_last_four ?? '').replace(/\D/g, '').slice(0, 4) || null
    : null;

  return {
    name: String(body.name ?? '').trim(),
    father_spouse_name: optionalText(body.father_spouse_name ?? body.father_name ?? body.father),
    nic_state_id: optionalText(body.nic_state_id ?? body.cnic),
    ssn_last_four: ssnLastFour,
    email: optionalText(body.email)?.toLowerCase() || null,
    phone: optionalText(body.phone),
    address: optionalText(body.address),
    city: optionalText(body.city),
    state_province: optionalText(body.state_province),
    postal_code: optionalText(body.postal_code),
    country,
    role: optionalText(body.role),
    employment_type: employmentType,
    start_date: body.start_date || body.date || null,
    manager: optionalText(body.manager ?? body.mgr),
    emergency_contact_name: optionalText(body.emergency_contact_name),
    emergency_contact_phone: optionalText(body.emergency_contact_phone),
    drive_folder: optionalText(body.drive_folder ?? body.drive),
    internal_notes: optionalText(body.internal_notes),
    checks,
    progress: checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 0,
  };
}

function validate(employee) {
  if (!employee.name) return 'Full name is required.';
  if (employee.ssn_last_four && employee.ssn_last_four.length !== 4) {
    return 'SSN last four must contain exactly four digits.';
  }
  if (employee.drive_folder && !/^https?:\/\//i.test(employee.drive_folder)) {
    return 'The Drive folder must be a full link starting with http:// or https://.';
  }
  return null;
}

function rowToApi(row) {
  return {
    id: row.id,
    name: row.name,
    father_spouse_name: row.father_spouse_name,
    nic_state_id: row.nic_state_id,
    ssn_last_four: row.ssn_last_four,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state_province: row.state_province,
    postal_code: row.postal_code,
    country: row.country,
    role: row.role,
    employment_type: row.employment_type,
    start_date: row.start_date,
    manager: row.manager,
    emergency_contact_name: row.emergency_contact_name,
    emergency_contact_phone: row.emergency_contact_phone,
    drive_folder: row.drive_folder,
    internal_notes: row.internal_notes,
    progress: row.progress,
    checks: Array.isArray(row.checks) ? row.checks : [],
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const queryId = req.query?.id;
    const id = Array.isArray(queryId) ? queryId[0] : queryId;

    if (id && !UUID_PATTERN.test(id)) {
      return res.status(400).json({ error: 'Invalid employee ID.' });
    }

    if (req.method === 'GET' && !id) {
      const rows = await sql`SELECT * FROM employees ORDER BY created_at DESC`;
      return res.status(200).json(rows.map(rowToApi));
    }

    if (req.method === 'POST' && !id) {
      const employee = clean(req.body);
      const validationError = validate(employee);
      if (validationError) return res.status(400).json({ error: validationError });

      const rows = await sql`
        INSERT INTO employees (
          name, father_spouse_name, nic_state_id, ssn_last_four, email, phone,
          address, city, state_province, postal_code, country, role, employment_type,
          start_date, manager, emergency_contact_name, emergency_contact_phone,
          drive_folder, internal_notes, progress, checks
        ) VALUES (
          ${employee.name}, ${employee.father_spouse_name}, ${employee.nic_state_id},
          ${employee.ssn_last_four}, ${employee.email}, ${employee.phone}, ${employee.address},
          ${employee.city}, ${employee.state_province}, ${employee.postal_code}, ${employee.country},
          ${employee.role}, ${employee.employment_type}, ${employee.start_date}, ${employee.manager},
          ${employee.emergency_contact_name}, ${employee.emergency_contact_phone},
          ${employee.drive_folder}, ${employee.internal_notes}, ${employee.progress},
          ${JSON.stringify(employee.checks)}
        )
        RETURNING *`;
      return res.status(201).json(rowToApi(rows[0]));
    }

    if (req.method === 'PUT' && id) {
      const employee = clean(req.body);
      const validationError = validate(employee);
      if (validationError) return res.status(400).json({ error: validationError });

      const rows = await sql`
        UPDATE employees SET
          name = ${employee.name}, father_spouse_name = ${employee.father_spouse_name},
          nic_state_id = ${employee.nic_state_id}, ssn_last_four = ${employee.ssn_last_four},
          email = ${employee.email}, phone = ${employee.phone}, address = ${employee.address},
          city = ${employee.city}, state_province = ${employee.state_province},
          postal_code = ${employee.postal_code}, country = ${employee.country},
          role = ${employee.role}, employment_type = ${employee.employment_type},
          start_date = ${employee.start_date}, manager = ${employee.manager},
          emergency_contact_name = ${employee.emergency_contact_name},
          emergency_contact_phone = ${employee.emergency_contact_phone},
          drive_folder = ${employee.drive_folder}, internal_notes = ${employee.internal_notes},
          progress = ${employee.progress}, checks = ${JSON.stringify(employee.checks)},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *`;
      if (!rows.length) return res.status(404).json({ error: 'Employee not found.' });
      return res.status(200).json(rowToApi(rows[0]));
    }

    if (req.method === 'DELETE' && id) {
      const rows = await sql`DELETE FROM employees WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: 'Employee not found.' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.status ? error.message : 'Could not access the employee database.',
    });
  }
}
