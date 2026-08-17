INSERT INTO t_p22961065_vector_driving_instr.pdd_categories (slug, label, icon, sort_order) VALUES
('osnovy', 'Основы ПДД', 'BookOpen', 1),
('znaki', 'Дорожные знаки', 'Signpost', 2),
('razmetka', 'Разметка', 'Milestone', 3),
('svetofor', 'Светофоры и регулировщик', 'TrafficCone', 4),
('perekrestki', 'Проезд перекрёстков', 'Shuffle', 5),
('pereskhod', 'Пешеходные переходы', 'PersonStanding', 6);

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'obshie-polozheniya', 'Общие положения', 'Основные термины и определения ПДД: что такое "водитель", "транспортное средство", "дорога", "полоса движения" и другие ключевые понятия, которые нужно знать перед изучением остальных разделов.', 1
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='osnovy';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'obyazannosti-voditeley', 'Обязанности водителей', 'Что обязан делать водитель перед выездом и во время движения: иметь при себе документы, проходить техосмотр, соблюдать требования знаков и разметки.', 2
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='osnovy';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'preduprezhdayushie', 'Предупреждающие знаки', 'Знаки, информирующие водителя о приближении к опасному участку дороги: пешеходный переход, дети, скользкая дорога и другие.', 1
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='znaki';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'zapreshayushie', 'Запрещающие знаки', 'Знаки, вводящие или отменяющие определённые ограничения движения: въезд запрещён, обгон запрещён, ограничение скорости.', 2
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='znaki';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'gorizontalnaya', 'Горизонтальная разметка', 'Линии, стрелы, надписи на проезжей части: сплошная, прерывистая, двойная сплошная и их значение для движения.', 1
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='razmetka';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'regulируемые-perekrestki', 'Регулируемые перекрёстки', 'Порядок проезда перекрёстков, где движение регулируется светофором или регулировщиком: очерёдность проезда, сигналы, действия при жёлтом мигающем сигнале.', 1
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='perekrestki';

INSERT INTO t_p22961065_vector_driving_instr.pdd_topics (category_id, slug, title, content, sort_order)
SELECT id, 'nereguliruemye-perekrestki', 'Нерегулируемые перекрёстки', 'Правило "помеха справа", проезд равнозначных и неравнозначных перекрёстков, действие знаков приоритета.', 2
FROM t_p22961065_vector_driving_instr.pdd_categories WHERE slug='perekrestki';
