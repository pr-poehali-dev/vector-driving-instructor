INSERT INTO t_p22961065_vector_driving_instr.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats, is_active)
VALUES ('QA2 Test Manager', 'qa2_test_manager_tmp', '38d16e872b86d2a66ee47be054e1780948a0003322c84bd4a5fa0550aec6317a', TRUE, FALSE, FALSE, FALSE, TRUE)
ON CONFLICT DO NOTHING;
