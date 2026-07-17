INSERT INTO t_p22961065_vector_driving_instr.students (name, login, password_hash, is_active, notes)
VALUES ('QA3 Test Student', 'qa3_test_student_tmp', '2e386c3845684d06324fd4ff692675bf93a4e078c00f9120499f4e4d93f5f113', TRUE, 'temp')
ON CONFLICT DO NOTHING;
