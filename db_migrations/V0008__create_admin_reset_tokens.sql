CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.admin_reset_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

INSERT INTO t_p22961065_vector_driving_instr.admin_reset_tokens (token)
VALUES ('RESET-VECTOR-2026');
