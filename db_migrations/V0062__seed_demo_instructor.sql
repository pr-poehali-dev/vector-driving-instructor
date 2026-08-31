INSERT INTO instructors (name, login, password_hash, branch_id, car_model)
VALUES ('Смирнов Алексей Викторович', 'smirnov', 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5', 1, 'Lada Vesta (АУ 777 45)')
ON CONFLICT (login) DO NOTHING;

INSERT INTO instructor_kpi (instructor_id, period, pdd_test_passed, pdd_test_points, practical_pass_percent, practical_passed, practical_total, practical_points, students_at_exam, students_at_exam_points, reviews_count, reviews_points, package_upgrades, package_upgrades_points, discipline_points, service_points, rank_in_branch, bonus_amount, bonus_label)
SELECT id, date_trunc('month', now())::date, true, 20, 85, 10, 12, 22, 12, 15, 11, 15, 3, 7, 10, 5, 1, 5000, 'Мастер месяца'
FROM instructors WHERE login = 'smirnov'
ON CONFLICT (instructor_id, period) DO NOTHING;
