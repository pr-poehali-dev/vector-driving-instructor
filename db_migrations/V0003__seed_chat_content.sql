
INSERT INTO t_p22961065_vector_driving_instr.chat_topics (slug, label, icon, sort_order) VALUES
('parallel-parking',  'Параллельная парковка',          'ParkingSquare', 1),
('garage-parking',    'Заезд в гараж',                  'Warehouse',     2),
('u-turn',            'Разворот',                       'RotateCcw',     3),
('intersections',     'Правила перекрёстков',            'GitFork',       4),
('emergency-braking', 'Экстренное торможение',           'AlertTriangle', 5);

-- Параллельная парковка
INSERT INTO t_p22961065_vector_driving_instr.chat_messages (topic_id, sort_order, text, image_url, image_caption, video_title, video_url, video_thumb, options) VALUES
(1, 1, 'Параллельная парковка — один из самых важных навыков. Разберём пошагово.', NULL, NULL, NULL, NULL, NULL, '[]'),
(1, 2, '📌 Шаг 1: Подъезжайте параллельно автомобилю спереди на расстоянии 50–70 см, выровняйте задние бамперы.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Parallel_parking_sequence.svg/640px-Parallel_parking_sequence.svg.png', 'Схема параллельной парковки', NULL, NULL, NULL, '[]'),
(1, 3, '📌 Шаг 2: Включите заднюю передачу. Поворачивайте руль вправо до упора и медленно двигайтесь назад до угла 45°.', NULL, NULL, NULL, NULL, NULL, '[]'),
(1, 4, '📌 Шаг 3: Выровняйте руль и продолжайте движение назад, пока передний бампер не поравняется с задним бампером переднего авто.', NULL, NULL, NULL, NULL, NULL, '[]'),
(1, 5, '📌 Шаг 4: Поверните руль влево до упора и заканчивайте манёвр. Центруйте авто в парковочном месте.', NULL, NULL, NULL, NULL, NULL, '[]'),
(1, 6, '🎬 Посмотрите видеоурок по параллельной парковке:', NULL, NULL, 'Параллельная парковка — полный разбор', 'https://www.youtube.com/embed/tT0fZm2jMD4', 'https://img.youtube.com/vi/tT0fZm2jMD4/hqdefault.jpg', '[]'),
(1, 7, '✅ Главное правило: не торопитесь! Скорость при парковке — пешеходная. Что ещё хотите разобрать?', NULL, NULL, NULL, NULL, NULL, '["Заезд в гараж","Разворот в ограниченном пространстве","Правила перекрёстков"]');

-- Заезд в гараж
INSERT INTO t_p22961065_vector_driving_instr.chat_messages (topic_id, sort_order, text, image_url, image_caption, video_title, video_url, video_thumb, options) VALUES
(2, 1, 'Заезд в гараж задним ходом — навык, который требует точности. Объясняю технику.', NULL, NULL, NULL, NULL, NULL, '[]'),
(2, 2, '📌 Подготовка: встаньте перед гаражом на расстоянии 2–3 метра, выровняйте автомобиль по оси ворот.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Reverse_parking_sequence.svg/640px-Reverse_parking_sequence.svg.png', 'Заезд в гараж задним ходом', NULL, NULL, NULL, '[]'),
(2, 3, '📌 Движение: включите заднюю передачу, смотрите в зеркала попеременно. Скорость — медленнее шага.', NULL, NULL, NULL, NULL, NULL, '[]'),
(2, 4, '📌 Ориентиры: когда в зеркале заднего вида видите оба края ворот на равном расстоянии — вы едете прямо.', NULL, NULL, NULL, NULL, NULL, '[]'),
(2, 5, '🎬 Видеоурок: заезд в гараж с первого раза:', NULL, NULL, 'Заезд в гараж задним ходом', 'https://www.youtube.com/embed/wNBfFBxH0PM', 'https://img.youtube.com/vi/wNBfFBxH0PM/hqdefault.jpg', '[]'),
(2, 6, '✅ Практикуйтесь на открытой площадке, ставя конусы. Что ещё разберём?', NULL, NULL, NULL, NULL, NULL, '["Параллельная парковка","Разворот","Правила перекрёстков"]');

-- Разворот
INSERT INTO t_p22961065_vector_driving_instr.chat_messages (topic_id, sort_order, text, image_url, image_caption, video_title, video_url, video_thumb, options) VALUES
(3, 1, 'Разворот в ограниченном пространстве — обязательный элемент экзамена. Покажу технику.', NULL, NULL, NULL, NULL, NULL, '[]'),
(3, 2, '📌 Разворот за 3 приёма: 1) Выезд вперёд; 2) Задний ход с поворотом; 3) Выезд вперёд с выравниванием.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Three-point_turn.svg/640px-Three-point_turn.svg.png', 'Схема разворота за 3 приёма', NULL, NULL, NULL, '[]'),
(3, 3, '⚠️ Важно: перед каждым движением проверяйте зеркала и слепые зоны. Убедитесь, что дорога свободна не менее чем на 50 метров.', NULL, NULL, NULL, NULL, NULL, '[]'),
(3, 4, '🎬 Видео: разворот в узком месте — пошагово:', NULL, NULL, 'Разворот в 3 приёма', 'https://www.youtube.com/embed/VHFbtiLUPl0', 'https://img.youtube.com/vi/VHFbtiLUPl0/hqdefault.jpg', '[]'),
(3, 5, '✅ Запомните: спешка — главная ошибка. Манёвр должен быть плавным и контролируемым.', NULL, NULL, NULL, NULL, NULL, '["Параллельная парковка","Заезд в гараж","Экстренное торможение"]');

-- Перекрёстки
INSERT INTO t_p22961065_vector_driving_instr.chat_messages (topic_id, sort_order, text, image_url, image_caption, video_title, video_url, video_thumb, options) VALUES
(4, 1, 'Перекрёстки — самые аварийные места. Разберём правила приоритета.', NULL, NULL, NULL, NULL, NULL, '[]'),
(4, 2, '📌 Правило «помехи справа»: на равнозначном перекрёстке уступайте тому, кто едет справа от вас.', NULL, NULL, NULL, NULL, NULL, '[]'),
(4, 3, '📌 Главная дорога: если вы на второстепенной — уступите всем, кто на главной, независимо от направления.', NULL, NULL, NULL, NULL, NULL, '[]'),
(4, 4, '📌 Поворот налево: уступайте встречному транспорту, движущемуся прямо или направо.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Left_turn_on_green.svg/640px-Left_turn_on_green.svg.png', 'Приоритет при повороте налево', NULL, NULL, NULL, '[]'),
(4, 5, '🎬 Видеоурок — правила проезда перекрёстков:', NULL, NULL, 'Правила проезда перекрёстков', 'https://www.youtube.com/embed/nLv-F63BVfE', 'https://img.youtube.com/vi/nLv-F63BVfE/hqdefault.jpg', '[]'),
(4, 6, '✅ Золотое правило: лучше подождать лишнюю секунду, чем создать аварийную ситуацию.', NULL, NULL, NULL, NULL, NULL, '["Параллельная парковка","Экстренное торможение","Разворот"]');

-- Экстренное торможение
INSERT INTO t_p22961065_vector_driving_instr.chat_messages (topic_id, sort_order, text, image_url, image_caption, video_title, video_url, video_thumb, options) VALUES
(5, 1, 'Экстренное торможение — навык, который может спасти жизнь. Изучим технику.', NULL, NULL, NULL, NULL, NULL, '[]'),
(5, 2, '📌 На автомобиле с ABS: нажмите педаль тормоза резко и до упора. Не отпускайте!', NULL, NULL, NULL, NULL, NULL, '[]'),
(5, 3, '📌 Без ABS: нажимайте тормоз прерывисто или с нарастающим усилием, чтобы не заблокировать колёса.', NULL, NULL, NULL, NULL, NULL, '[]'),
(5, 4, '⚠️ Важно: руки держите прямо! При торможении не поворачивайте руль — это вызовет занос.', NULL, NULL, NULL, NULL, NULL, '[]'),
(5, 5, '🎬 Видео: техника экстренного торможения:', NULL, NULL, 'Экстренное торможение — техника', 'https://www.youtube.com/embed/TGhYMjwfO4Y', 'https://img.youtube.com/vi/TGhYMjwfO4Y/hqdefault.jpg', '[]'),
(5, 6, '✅ Помните о безопасной дистанции: при 60 км/ч — минимум 30 метров до впереди идущего авто.', NULL, NULL, NULL, NULL, NULL, '["Параллельная парковка","Правила перекрёстков","Разворот"]');
