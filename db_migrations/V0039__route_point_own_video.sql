-- Каждая точка маршрута теперь содержит собственное видео (как медиа-вложение в чате),
-- вместо одного общего видео на весь маршрут с таймкодами.
ALTER TABLE t_p22961065_vector_driving_instr.route_points
  ADD COLUMN IF NOT EXISTS video_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS video_title VARCHAR(300) NULL,
  ADD COLUMN IF NOT EXISTS video_thumb TEXT NULL;
