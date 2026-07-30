CREATE TABLE t_p22961065_vector_driving_instr.support_tickets (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    student_name VARCHAR(100) NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'new',
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON t_p22961065_vector_driving_instr.support_tickets(status);
