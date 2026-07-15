UPDATE t_p22961065_vector_driving_instr.managers
SET is_active = FALSE, login = login || '_qa_disabled'
WHERE login IN ('qa_test_manager_tmp', 'qa_test_noperms_tmp');
