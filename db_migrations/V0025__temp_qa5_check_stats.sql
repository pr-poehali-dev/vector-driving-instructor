INSERT INTO t_p22961065_vector_driving_instr.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats, is_active)
VALUES ('QA5 Check Stats', 'qa5_check_stats_tmp', '9309be63c1b6e29cf3c8d8b9e49177834305318dfd41c787844e856ed6f64ce3', FALSE, FALSE, FALSE, TRUE, TRUE)
ON CONFLICT DO NOTHING;
