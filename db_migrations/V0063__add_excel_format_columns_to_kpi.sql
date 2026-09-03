ALTER TABLE instructor_kpi
  ADD COLUMN IF NOT EXISTS reviews integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exams integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS package_upgrades_n integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdd_status varchar(10) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discipline integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS service integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';

UPDATE instructor_kpi SET
  reviews = reviews_count,
  exams = students_at_exam,
  passed = practical_passed,
  package_upgrades_n = package_upgrades,
  pdd_status = CASE WHEN pdd_test_passed THEN 'sdal' ELSE '' END,
  discipline = discipline_points,
  service = service_points;
