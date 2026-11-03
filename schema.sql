-- Run this in the Neon SQL Editor before deploying the updated app.
-- It is safe to run more than once and preserves existing employee records.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  father_spouse_name TEXT,
  nic_state_id TEXT,
  ssn_last_four VARCHAR(4),
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Pakistan',
  role TEXT,
  employment_type TEXT,
  start_date DATE,
  manager TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  drive_folder TEXT,
  internal_notes TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_ssn_last_four_check
    CHECK (ssn_last_four IS NULL OR ssn_last_four ~ '^[0-9]{4}$'),
  CONSTRAINT employees_country_check
    CHECK (country IN ('Pakistan', 'United States')),
  CONSTRAINT employees_employment_type_check
    CHECK (employment_type IS NULL OR employment_type IN ('Full-time', 'Part-time', 'Contractor', 'Intern'))
);

-- Add the international fields to databases created with the earlier schema.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS father_spouse_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nic_state_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ssn_last_four VARCHAR(4);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS state_province TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Pakistan';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Copy data from the old column names when upgrading an existing database.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'father_name'
  ) THEN
    EXECUTE 'UPDATE employees SET father_spouse_name = father_name WHERE father_spouse_name IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'cnic'
  ) THEN
    EXECUTE 'UPDATE employees SET nic_state_id = cnic WHERE nic_state_id IS NULL';
  END IF;
END $$;

-- Older databases did not have these checks, so add them after the new columns exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_ssn_last_four_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_ssn_last_four_check
      CHECK (ssn_last_four IS NULL OR ssn_last_four ~ '^[0-9]{4}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_country_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_country_check
      CHECK (country IN ('Pakistan', 'United States'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_employment_type_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_employment_type_check
      CHECK (employment_type IS NULL OR employment_type IN ('Full-time', 'Part-time', 'Contractor', 'Intern'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS employees_name_idx ON employees (name);
