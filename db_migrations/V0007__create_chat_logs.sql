CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.chat_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES t_p22961065_vector_driving_instr.students(id),
  student_name VARCHAR(100) NOT NULL DEFAULT '',
  mode VARCHAR(10) NOT NULL DEFAULT 'ai',
  role VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_logs_student_idx ON t_p22961065_vector_driving_instr.chat_logs(student_id);
CREATE INDEX IF NOT EXISTS chat_logs_created_idx ON t_p22961065_vector_driving_instr.chat_logs(created_at DESC);
