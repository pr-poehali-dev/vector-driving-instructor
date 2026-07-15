-- Временный тестовый менеджер со всеми правами для проверки доступа (будет удалён после теста)
INSERT INTO t_p22961065_vector_driving_instr.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats, is_active)
VALUES ('QA Test Manager', 'qa_test_manager_tmp', '1f859d322a10d6c549d98eada3bdf307fb0127c814065c6f4378117f5416bda0', TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT DO NOTHING;
