CREATE TABLE t_p22961065_vector_driving_instr.ai_training_suggestions (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    issue TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    target_field VARCHAR(20) NOT NULL DEFAULT 'extra_sources',
    sample_dialog TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ NULL
);

CREATE TABLE t_p22961065_vector_driving_instr.ai_training_runs (
    id SERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_log_id INTEGER NOT NULL DEFAULT 0,
    logs_analyzed INTEGER NOT NULL DEFAULT 0,
    suggestions_created INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_ai_training_suggestions_status ON t_p22961065_vector_driving_instr.ai_training_suggestions(status);
