CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.site_settings (
  id serial PRIMARY KEY,
  chat_topics_enabled boolean NOT NULL DEFAULT TRUE,
  chat_ai_enabled boolean NOT NULL DEFAULT TRUE,
  maintenance_mode boolean NOT NULL DEFAULT FALSE,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO t_p22961065_vector_driving_instr.site_settings (chat_topics_enabled, chat_ai_enabled, maintenance_mode)
SELECT TRUE, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM t_p22961065_vector_driving_instr.site_settings);
