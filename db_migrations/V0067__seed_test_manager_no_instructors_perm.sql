INSERT INTO managers (name, login, password_hash, can_instructors, is_active)
VALUES ('QA Тест Без Прав', 'qa_test_noperm', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', false, true)
ON CONFLICT (login) DO UPDATE SET can_instructors = false, is_active = true, password_hash = EXCLUDED.password_hash;
