-- Экзаменационные маршруты (например, "Маршрут №1 — Курган, автодром")
CREATE TABLE t_p22961065_vector_driving_instr.exam_routes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Курган',
    description TEXT NOT NULL DEFAULT '',
    video_url TEXT NULL,
    center_lat DOUBLE PRECISION NOT NULL DEFAULT 55.4500,
    center_lng DOUBLE PRECISION NOT NULL DEFAULT 65.3333,
    zoom_level INTEGER NOT NULL DEFAULT 14,
    route_line JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Точки маршрута (перекрёстки, повороты, развороты, переходы и т.д.)
CREATE TABLE t_p22961065_vector_driving_instr.route_points (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.exam_routes(id),
    point_number INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(300) NOT NULL,
    point_type VARCHAR(30) NOT NULL DEFAULT 'other',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    video_timestamp_sec INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    action_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    common_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdd_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheme_image_url TEXT NULL,
    difficulty VARCHAR(10) NOT NULL DEFAULT 'normal',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_route_points_route ON t_p22961065_vector_driving_instr.route_points(route_id);

-- Прогресс изучения точек маршрута учеником
CREATE TABLE t_p22961065_vector_driving_instr.student_route_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    route_point_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.route_points(id),
    studied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, route_point_id)
);

CREATE INDEX idx_student_route_progress_student ON t_p22961065_vector_driving_instr.student_route_progress(student_id);

ALTER TABLE t_p22961065_vector_driving_instr.managers ADD COLUMN IF NOT EXISTS can_route BOOLEAN NOT NULL DEFAULT FALSE;
