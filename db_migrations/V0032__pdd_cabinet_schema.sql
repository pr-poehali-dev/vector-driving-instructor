-- Расширяем карточку ученика для кабинета
ALTER TABLE t_p22961065_vector_driving_instr.students
  ADD COLUMN IF NOT EXISTS study_category VARCHAR(10) NOT NULL DEFAULT 'B',
  ADD COLUMN IF NOT EXISTS group_name VARCHAR(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS study_status VARCHAR(20) NOT NULL DEFAULT 'studying',
  ADD COLUMN IF NOT EXISTS study_start_date DATE NULL;

-- Категории ПДД (верхний уровень: Основы, Знаки, Разметка и т.д.)
CREATE TABLE t_p22961065_vector_driving_instr.pdd_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'BookOpen',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Темы внутри категории (учебный материал)
CREATE TABLE t_p22961065_vector_driving_instr.pdd_topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.pdd_categories(id),
    slug VARCHAR(150) NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    image_url TEXT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

-- Банк вопросов (используется для тестов по темам, случайных тестов, билетов в будущем)
CREATE TABLE t_p22961065_vector_driving_instr.pdd_questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.pdd_categories(id),
    topic_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.pdd_topics(id),
    text TEXT NOT NULL,
    image_url TEXT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_index SMALLINT NOT NULL DEFAULT 0,
    explanation TEXT NOT NULL DEFAULT '',
    difficulty SMALLINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdd_questions_topic ON t_p22961065_vector_driving_instr.pdd_questions(topic_id);
CREATE INDEX idx_pdd_questions_category ON t_p22961065_vector_driving_instr.pdd_questions(category_id);

-- Сессии прохождения тестов (по теме, случайный, работа над ошибками)
CREATE TABLE t_p22961065_vector_driving_instr.test_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    test_type VARCHAR(20) NOT NULL DEFAULT 'topic',
    topic_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.pdd_topics(id),
    category_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.pdd_categories(id),
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_test_sessions_student ON t_p22961065_vector_driving_instr.test_sessions(student_id);

-- Ответы ученика в рамках сессии теста
CREATE TABLE t_p22961065_vector_driving_instr.test_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.test_sessions(id),
    question_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.pdd_questions(id),
    selected_index SMALLINT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_answers_session ON t_p22961065_vector_driving_instr.test_answers(session_id);

-- Работа над ошибками: какие вопросы ученик регулярно решает неверно
CREATE TABLE t_p22961065_vector_driving_instr.student_mistakes (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    question_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.pdd_questions(id),
    times_wrong INTEGER NOT NULL DEFAULT 1,
    last_wrong_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(student_id, question_id)
);

-- Прогресс изучения тем ПДД
CREATE TABLE t_p22961065_vector_driving_instr.student_pdd_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    topic_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.pdd_topics(id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    best_score_percent INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- Избранное (вопросы, темы)
CREATE TABLE t_p22961065_vector_driving_instr.favorites (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, item_type, item_id)
);

-- Уведомления от автошколы
CREATE TABLE t_p22961065_vector_driving_instr.notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    target_type VARCHAR(10) NOT NULL DEFAULT 'all',
    target_student_id INTEGER NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    target_group VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Прочитанные уведомления по ученикам
CREATE TABLE t_p22961065_vector_driving_instr.notification_reads (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.notifications(id),
    student_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.students(id),
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(notification_id, student_id)
);
