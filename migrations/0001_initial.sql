CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  password_hash text NOT NULL,
  session_version text NOT NULL,
  phone text,
  address text,
  title text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'MARKETER')),
  CONSTRAINT users_email_normalized_check CHECK (
    email = lower(btrim(email))
    AND length(email) <= 254
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  )
);

CREATE TABLE IF NOT EXISTS opportunities (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  school text NOT NULL,
  region text NOT NULL,
  service text NOT NULL,
  period text NOT NULL,
  stage text NOT NULL,
  status text NOT NULL,
  estimate bigint,
  final_value bigint,
  next_action text NOT NULL DEFAULT '',
  due text NOT NULL DEFAULT '',
  legacy boolean NOT NULL DEFAULT false,
  created bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_id_owner_unique UNIQUE (id, owner_id),
  CONSTRAINT opportunities_stage_check CHECK (
    stage IN ('Cold Lead', 'Contacted', 'Meeting Scheduled', 'Presentation Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')
  ),
  CONSTRAINT opportunities_status_check CHECK (status IN ('OPEN', 'WON', 'LOST')),
  CONSTRAINT opportunities_stage_status_check CHECK (
    (stage = 'Won' AND status = 'WON')
    OR (stage = 'Lost' AND status = 'LOST')
    OR (stage NOT IN ('Won', 'Lost') AND status = 'OPEN')
  ),
  CONSTRAINT opportunities_amount_check CHECK (
    (estimate IS NULL OR estimate BETWEEN 0 AND 9007199254740991)
    AND (final_value IS NULL OR final_value BETWEEN 0 AND 9007199254740991)
  ),
  CONSTRAINT opportunities_due_check CHECK (
    CASE
      WHEN due = '' THEN true
      ELSE due ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND to_char(due::date, 'YYYY-MM-DD') = due
    END
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_school_service_period_unique
  ON opportunities (lower(school), service, period);
CREATE INDEX IF NOT EXISTS opportunities_owner_idx ON opportunities (owner_id);
CREATE INDEX IF NOT EXISTS opportunities_due_idx ON opportunities (due);
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities (status);

CREATE TABLE IF NOT EXISTS activities (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES opportunities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  title text NOT NULL,
  summary text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activities_opportunity_owner_fk FOREIGN KEY (opportunity_id, owner_id)
    REFERENCES opportunities(id, owner_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS activities_owner_idx ON activities (owner_id);
CREATE INDEX IF NOT EXISTS activities_opportunity_idx ON activities (opportunity_id);
