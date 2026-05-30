CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.admin_passwords (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Записываем пароль 35584801 (SHA256)
INSERT INTO t_p22961065_vector_driving_instr.admin_passwords (password_hash)
VALUES (encode(sha256('35584301'), 'hex'));
