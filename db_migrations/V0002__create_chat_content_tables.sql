
CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.chat_topics (
  id SERIAL PRIMARY KEY,
  sort_order INTEGER DEFAULT 0,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'BookOpen',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22961065_vector_driving_instr.chat_messages (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES t_p22961065_vector_driving_instr.chat_topics(id),
  sort_order INTEGER DEFAULT 0,
  text TEXT NOT NULL,
  video_title TEXT,
  video_url TEXT,
  video_thumb TEXT,
  image_url TEXT,
  image_caption TEXT,
  options JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
