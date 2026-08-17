INSERT INTO t_p22961065_vector_driving_instr.pdd_questions (category_id, topic_id, text, options, correct_index, explanation, sort_order)
SELECT c.id, t.id,
'Что означает термин "уступить дорогу"?',
'["Остановиться и стоять до конца движения других ТС", "Не создавать помех участникам, имеющим преимущество", "Пропустить только пешеходов", "Снизить скорость до 20 км/ч"]'::jsonb,
1,
'Уступить дорогу — не начинать, не возобновлять движение и не выполнять манёвр, если это может вынудить других участников движения, имеющих преимущество, изменить направление или скорость.',
1
FROM t_p22961065_vector_driving_instr.pdd_categories c
JOIN t_p22961065_vector_driving_instr.pdd_topics t ON t.category_id=c.id AND t.slug='obshie-polozheniya'
WHERE c.slug='osnovy';

INSERT INTO t_p22961065_vector_driving_instr.pdd_questions (category_id, topic_id, text, options, correct_index, explanation, sort_order)
SELECT c.id, t.id,
'Какие документы водитель обязан иметь при себе во время движения?',
'["Только водительское удостоверение", "Водительское удостоверение и документы на ТС", "Только паспорт", "Документы не обязательны"]'::jsonb,
1,
'Водитель обязан иметь при себе водительское удостоверение, регистрационные документы на транспортное средство и страховой полис ОСАГО.',
1
FROM t_p22961065_vector_driving_instr.pdd_categories c
JOIN t_p22961065_vector_driving_instr.pdd_topics t ON t.category_id=c.id AND t.slug='obyazannosti-voditeley'
WHERE c.slug='osnovy';

INSERT INTO t_p22961065_vector_driving_instr.pdd_questions (category_id, topic_id, text, options, correct_index, explanation, sort_order)
SELECT c.id, t.id,
'Как должен поступить водитель при жёлтом мигающем сигнале светофора на регулируемом перекрёстке?',
'["Немедленно остановиться", "Проезжать с повышенным вниманием, руководствуясь знаками приоритета", "Ждать зелёного сигнала", "Перекрёсток закрыт для проезда"]'::jsonb,
1,
'Жёлтый мигающий сигнал разрешает движение, но информирует о нерегулируемом перекрёстке или переходе — водитель должен руководствоваться знаками приоритета и разметкой.',
1
FROM t_p22961065_vector_driving_instr.pdd_categories c
JOIN t_p22961065_vector_driving_instr.pdd_topics t ON t.category_id=c.id AND t.slug='reguliruemye-perekrestki'
WHERE c.slug='perekrestki';

INSERT INTO t_p22961065_vector_driving_instr.pdd_questions (category_id, topic_id, text, options, correct_index, explanation, sort_order)
SELECT c.id, t.id,
'Что означает правило "помеха справа" на нерегулируемом равнозначном перекрёстке?',
'["Преимущество у ТС слева", "Преимущество у ТС справа", "Преимущество у того, кто едет быстрее", "Преимущество у общественного транспорта"]'::jsonb,
1,
'На нерегулируемом перекрёстке равнозначных дорог водитель обязан уступить дорогу транспортным средствам, приближающимся справа.',
1
FROM t_p22961065_vector_driving_instr.pdd_categories c
JOIN t_p22961065_vector_driving_instr.pdd_topics t ON t.category_id=c.id AND t.slug='nereguliruemye-perekrestki'
WHERE c.slug='perekrestki';

INSERT INTO t_p22961065_vector_driving_instr.pdd_questions (category_id, topic_id, text, options, correct_index, explanation, sort_order)
SELECT c.id, t.id,
'Что означает знак "Двойная сплошная линия"?',
'["Разрешён обгон при отсутствии встречных ТС", "Пересечение и выезд на встречную полосу запрещены", "Разметка временная, можно пересекать", "Обозначает край проезжей части"]'::jsonb,
1,
'Двойная сплошная линия разметки разделяет транспортные потоки противоположных направлений и её пересечение запрещено при любых условиях.',
1
FROM t_p22961065_vector_driving_instr.pdd_categories c
JOIN t_p22961065_vector_driving_instr.pdd_topics t ON t.category_id=c.id AND t.slug='gorizontalnaya'
WHERE c.slug='razmetka';
