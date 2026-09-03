ALTER TABLE managers ADD COLUMN IF NOT EXISTS can_instructors boolean NOT NULL DEFAULT false;
