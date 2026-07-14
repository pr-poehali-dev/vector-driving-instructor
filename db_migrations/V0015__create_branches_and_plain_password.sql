-- Таблица филиалов
CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  work_hours TEXT NOT NULL DEFAULT 'Пн–Вс: 8:30–20:30',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Переносим текущий адрес/телефон как первый (дефолтный) филиал
INSERT INTO t_p22961065_vector_driving_instr.branches (name, address, phone, work_hours, sort_order, is_default)
VALUES ('Курган, 4-й микрорайон', 'г. Курган, 4-й микрорайон, 32', '+79195915558', 'Пн–Вс: 8:30–20:30', 0, TRUE);

-- Открытый пароль ученика — чтобы менеджер мог подсказать забывшему
ALTER TABLE t_p22961065_vector_driving_instr.students
  ADD COLUMN IF NOT EXISTS plain_password TEXT;
