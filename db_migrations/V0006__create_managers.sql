CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.managers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  login VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  can_students BOOLEAN NOT NULL DEFAULT FALSE,
  can_content BOOLEAN NOT NULL DEFAULT FALSE,
  can_ai BOOLEAN NOT NULL DEFAULT FALSE,
  can_stats BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.manager_sessions (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.managers(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);
