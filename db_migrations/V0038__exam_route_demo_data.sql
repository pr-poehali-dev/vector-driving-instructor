INSERT INTO t_p22961065_vector_driving_instr.exam_routes
  (title, city, description, video_url, center_lat, center_lng, zoom_level, route_line, sort_order)
VALUES
  (
    'Экзаменационный маршрут №1',
    'Курган',
    'Классический экзаменационный маршрут по центру Кургана: от площади через перекрёстки, разворот и пешеходные переходы.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    55.4500, 65.3333, 15,
    '[[55.4500,65.3300],[55.4508,65.3315],[55.4515,65.3330],[55.4510,65.3350],[55.4495,65.3355],[55.4485,65.3340],[55.4490,65.3320]]'::jsonb,
    1
  );

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 1, 'Начало маршрута — выезд с площади', 'start', 55.4500, 65.3300, 0,
  'Старт маршрута от площади. Инструктор проверяет готовность автомобиля и ученика перед началом движения.',
  '["Проверить зеркала и ремень безопасности", "Убедиться в отсутствии помех", "Плавно тронуться с места"]'::jsonb,
  '["Резкий старт", "Не проверил зеркала перед началом движения"]'::jsonb,
  '["п. 8.1 ПДД РФ — начало движения"]'::jsonb,
  'normal', 1
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 2, 'ул. Пролетарская — ул. К. Мяготина', 'turn_left', 55.4508, 65.3315, 45,
  'Поворот налево на регулируемом перекрёстке. Необходимо занять крайнее левое положение заранее и уступить дорогу встречному транспорту.',
  '["Заранее перестроиться в крайний левый ряд", "Включить указатель поворота за 50-100 м", "Уступить дорогу встречным ТС", "Выполнить поворот, не выезжая на полосу встречного движения"]'::jsonb,
  '["Позднее включение указателя поворота", "Неправильный выбор полосы перед поворотом", "Непредоставление преимущества встречным автомобилям"]'::jsonb,
  '["п. 8.5 ПДД РФ — расположение перед поворотом", "п. 13.4 ПДД РФ — поворот налево на перекрёстке"]'::jsonb,
  'hard', 2
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 3, 'Перекрёсток ул. Гоголя', 'intersection', 55.4515, 65.3330, 95,
  'Нерегулируемый перекрёсток равнозначных дорог. Действует правило "помеха справа".',
  '["Снизить скорость при подъезде к перекрёстку", "Оценить обстановку по правилу помехи справа", "Продолжить движение при отсутствии помех"]'::jsonb,
  '["Проезд перекрёстка без снижения скорости", "Игнорирование правила помехи справа"]'::jsonb,
  '["п. 13.11 ПДД РФ — проезд перекрёстков равнозначных дорог"]'::jsonb,
  'normal', 3
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 4, 'Разворот у сквера', 'u_turn', 55.4510, 65.3350, 140,
  'Разворот вне перекрёстка при разрешающей разметке. Нужно убедиться в безопасности манёвра и достаточной ширине проезжей части.',
  '["Включить указатель левого поворота", "Убедиться в отсутствии встречного и попутного транспорта", "Выполнить разворот за один приём, не выезжая на обочину"]'::jsonb,
  '["Разворот в несколько приёмов без необходимости", "Выполнение разворота при плохой видимости", "Создание помехи встречному транспорту"]'::jsonb,
  '["п. 8.11 ПДД РФ — разворот", "п. 8.1 ПДД РФ — общие требования при манёврах"]'::jsonb,
  'hard', 4
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 5, 'Пешеходный переход у школы', 'crosswalk', 55.4495, 65.3355, 175,
  'Нерегулируемый пешеходный переход в зоне с ограничением 20 км/ч. Требуется повышенное внимание к пешеходам.',
  '["Снизить скорость до разрешённой", "Быть готовым остановиться", "Уступить дорогу пешеходам, начавшим переход"]'::jsonb,
  '["Проезд на высокой скорости мимо перехода", "Непредоставление преимущества пешеходу"]'::jsonb,
  '["п. 14.1 ПДД РФ — уступить дорогу пешеходам", "приложение 2 — зона действия знака ограничения скорости"]'::jsonb,
  'normal', 5
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 6, 'Перестроение перед остановкой', 'lane_change', 55.4485, 65.3340, 210,
  'Перестроение в правый ряд для последующей остановки у тротуара. Уступить дорогу ТС, движущимся в этом ряду попутно.',
  '["Включить указатель правого поворота заранее", "Убедиться в безопасности перестроения", "Плавно перестроиться, не создавая помех"]'::jsonb,
  '["Резкое перестроение без сигнала", "Создание помехи попутному транспорту"]'::jsonb,
  '["п. 8.4 ПДД РФ — перестроение"]'::jsonb,
  'easy', 6
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';

INSERT INTO t_p22961065_vector_driving_instr.route_points
  (route_id, point_number, title, point_type, lat, lng, video_timestamp_sec, description, action_steps, common_mistakes, pdd_refs, difficulty, sort_order)
SELECT id, 7, 'Финишная остановка', 'stop', 55.4490, 65.3320, 245,
  'Завершение маршрута — остановка у тротуара с соблюдением требуемого положения относительно бордюра.',
  '["Плавно снизить скорость", "Остановиться не далее 30 см от края проезжей части", "Включить стояночный тормоз"]'::jsonb,
  '["Остановка слишком далеко от бордюра", "Резкое торможение в конце манёвра"]'::jsonb,
  '["п. 12.1 ПДД РФ — остановка и стоянка"]'::jsonb,
  'easy', 7
FROM t_p22961065_vector_driving_instr.exam_routes WHERE title='Экзаменационный маршрут №1';
