-- Инструкторы (мастера производственного обучения вождению)
CREATE TABLE IF NOT EXISTS instructors (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  login varchar(50) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  branch_id integer REFERENCES branches(id),
  car_model varchar(100) NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz
);

CREATE TABLE IF NOT EXISTS instructor_sessions (
  id serial PRIMARY KEY,
  instructor_id integer NOT NULL REFERENCES instructors(id),
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- KPI мастера за месяц (period = первое число месяца), проставляется вручную администратором/менеджером
CREATE TABLE IF NOT EXISTS instructor_kpi (
  id serial PRIMARY KEY,
  instructor_id integer NOT NULL REFERENCES instructors(id),
  period date NOT NULL,
  pdd_test_passed boolean NOT NULL DEFAULT false,
  pdd_test_points integer NOT NULL DEFAULT 0,
  practical_pass_percent integer NOT NULL DEFAULT 0,
  practical_passed integer NOT NULL DEFAULT 0,
  practical_total integer NOT NULL DEFAULT 0,
  practical_points integer NOT NULL DEFAULT 0,
  students_at_exam integer NOT NULL DEFAULT 0,
  students_at_exam_points integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  reviews_points integer NOT NULL DEFAULT 0,
  package_upgrades integer NOT NULL DEFAULT 0,
  package_upgrades_points integer NOT NULL DEFAULT 0,
  discipline_points integer NOT NULL DEFAULT 0,
  service_points integer NOT NULL DEFAULT 0,
  rank_in_branch integer,
  bonus_amount numeric(10,2) NOT NULL DEFAULT 0,
  bonus_label varchar(100) NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, period)
);

-- Загрузки видео с регистратора
CREATE TABLE IF NOT EXISTS instructor_video_uploads (
  id serial PRIMARY KEY,
  instructor_id integer NOT NULL REFERENCES instructors(id),
  shift_date date NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  s3_key text NOT NULL,
  s3_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Ежемесячный зачёт ПДД для инструктора
CREATE TABLE IF NOT EXISTS instructor_pdd_tests (
  id serial PRIMARY KEY,
  instructor_id integer NOT NULL REFERENCES instructors(id),
  total_questions integer NOT NULL DEFAULT 20,
  correct_count integer NOT NULL DEFAULT 0,
  passed boolean,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_instructor_kpi_period ON instructor_kpi(instructor_id, period);
CREATE INDEX IF NOT EXISTS idx_instructor_video_shift ON instructor_video_uploads(instructor_id, shift_date);
