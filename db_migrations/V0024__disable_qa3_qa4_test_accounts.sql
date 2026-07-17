UPDATE t_p22961065_vector_driving_instr.managers
SET is_active = FALSE, login = login || '_qa_disabled'
WHERE login = 'qa4_stats_manager_tmp';

UPDATE t_p22961065_vector_driving_instr.students
SET is_active = FALSE, login = login || '_qa_disabled'
WHERE login = 'qa3_test_student_tmp';
