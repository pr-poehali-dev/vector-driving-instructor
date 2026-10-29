CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  branch text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  note text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'site',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
