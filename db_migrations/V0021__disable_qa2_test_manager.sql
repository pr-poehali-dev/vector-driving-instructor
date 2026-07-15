UPDATE t_p22961065_vector_driving_instr.managers
SET is_active = FALSE, login = login || '_qa_disabled'
WHERE login = 'qa2_test_manager_tmp';
