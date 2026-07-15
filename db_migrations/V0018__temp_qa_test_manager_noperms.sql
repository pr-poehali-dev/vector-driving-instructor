-- Второй временный тестовый менеджер БЕЗ прав (проверка ограничений)
INSERT INTO t_p22961065_vector_driving_instr.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats, is_active)
VALUES ('QA Test NoPerms', 'qa_test_noperms_tmp', 'ca4dbdae8fa38cbdf886878c5a6691616db9edfe662da7178391c7c5d1450127', FALSE, FALSE, FALSE, FALSE, TRUE)
ON CONFLICT DO NOTHING;
