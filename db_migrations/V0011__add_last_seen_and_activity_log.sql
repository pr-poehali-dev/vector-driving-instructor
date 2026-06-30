-- Добавляем last_seen в таблицу учеников
ALTER TABLE t_p22961065_vector_driving_instr.students
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Добавляем last_seen в таблицу менеджеров
ALTER TABLE t_p22961065_vector_driving_instr.managers
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Журнал действий менеджеров
CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.activity_log (
  id          bigserial PRIMARY KEY,
  actor_type  text NOT NULL,   -- 'manager' | 'admin'
  actor_id    int,             -- manager id (null for admin)
  actor_name  text NOT NULL,
  action      text NOT NULL,   -- 'add_student', 'update_student', 'add_manager', etc.
  target_type text,            -- 'student' | 'manager' | 'topic' | 'message' | 'ai_settings'
  target_id   int,
  target_name text,
  details     text,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);
