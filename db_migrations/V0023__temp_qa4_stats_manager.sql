INSERT INTO t_p22961065_vector_driving_instr.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats, is_active)
VALUES ('QA4 Stats Manager', 'qa4_stats_manager_tmp', 'e5067c7ad065c37c8e0c56f7a6c13a6556790fa273f944990e99ea8b8e0756db', FALSE, FALSE, FALSE, TRUE, TRUE)
ON CONFLICT DO NOTHING;
