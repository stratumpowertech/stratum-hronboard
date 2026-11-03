-- Run this ONCE in the Neon SQL Editor, in the database you want to use.
-- It creates the employees table used by /api/employees, /api/sync and /api/health.
-- Safe to run again: it will not drop existing data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  father_name TEXT,
  cnic TEXT,
  email TEXT,
  address TEXT,
  role TEXT,
  start_date DATE,
  manager TEXT,
  drive_folder TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS employees_name_idx ON employees (name);
