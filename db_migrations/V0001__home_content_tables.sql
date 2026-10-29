CREATE TABLE IF NOT EXISTS home_items (
  id serial PRIMARY KEY,
  section text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS home_items_section_idx ON home_items (section, sort_order, id);

CREATE TABLE IF NOT EXISTS home_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO home_items (section, data, sort_order) VALUES
('fleet', $j${"group":"Tesla","title":"Tesla Model X","subtitle":"Занятие на ней входит в каждый тариф","image_url":"/home/g_teslaB.jpg","wide":false}$j$::jsonb, 1),
('fleet', $j${"group":"Tenet","title":"Tenet","subtitle":"Современные кроссоверы в фирменной раскраске","image_url":"/home/g_tenet3.jpg","wide":true}$j$::jsonb, 2),
('fleet', $j${"group":"Lada Granta","title":"Lada Granta","subtitle":"Классический учебный автомобиль","image_url":"/home/g_granta1.jpg","wide":false}$j$::jsonb, 3),
('fleet', $j${"group":"Tesla","title":"Tesla Model X","subtitle":"Фирменная раскраска школы","image_url":"/home/g_teslaA.jpg","wide":false}$j$::jsonb, 4),
('fleet', $j${"group":"Tenet","title":"Tenet","subtitle":"Серый и чёрный","image_url":"/home/g_tenet2.jpg","wide":false}$j$::jsonb, 5),
('fleet', $j${"group":"Lada Granta","title":"Площадка","subtitle":"Lada Granta на отработке упражнений","image_url":"/home/g_granta3.jpg","wide":true}$j$::jsonb, 6),

('masters', $j${"name":"Роман Зуев","role":"мастер · категория B","years":"14 лет","quote":"«Спокойно и по шагам: сначала площадка, потом город. Ошибка — это не приговор, а следующий пункт плана».","tags":["Город","Перекрёстки","Tesla","Экзамен ГИБДД"],"photo_url":"/home/g_instr.jpg","featured":true}$j$::jsonb, 1),
('masters', $j${"name":"Марина Ковалёва","role":"мастер по теории","years":"11 лет","quote":"Билеты ПДД, разбор сложных вопросов и дистанционные занятия.","tags":["Билеты ПДД","Дистанционно"],"photo_url":"","featured":false}$j$::jsonb, 2),
('masters', $j${"name":"Дмитрий Плотников","role":"мастер вождения","years":"9 лет","quote":"Механика и автомат, уверенное движение в плотном потоке.","tags":["Механика","Город","Площадка"],"photo_url":"","featured":false}$j$::jsonb, 3),
('masters', $j${"name":"Сергей Замятин","role":"мастер автодрома","years":"17 лет","quote":"Упражнения, габариты и подготовка к практическому экзамену.","tags":["Площадка","Упражнения"],"photo_url":"","featured":false}$j$::jsonb, 4),

('videos', $j${"title":"Вектор выезжает на закате","caption":"Облёт автомобиля с логотипом школы.","video_url":"/home/hero.mp4","poster_url":"/home/g_tenet3.jpg","format":"wide"}$j$::jsonb, 1),
('videos', $j${"title":"Из жизни школы","caption":"","video_url":"/home/reel.mp4","poster_url":"/home/g_teslaA.jpg","format":"vertical"}$j$::jsonb, 2),

('faq', $j${"question":"Чем отличаются категории A и B?","answer":"B — 2,5 месяца, автомобиль, АКПП или МКПП; A — 2 месяца, мотоцикл. Теория и старт каждые 15 дней. Базовая стоимость — от 19 900 ₽, точную цену и условия подскажет менеджер."}$j$::jsonb, 1),
('faq', $j${"question":"Что если не хватит занятий?","answer":"Можно докупить дополнительные занятия — количество и стоимость подскажет менеджер."}$j$::jsonb, 2),
('faq', $j${"question":"Есть ли рассрочка?","answer":"Да, на удобный период. Условия подскажет администратор филиала или мастер в чате."}$j$::jsonb, 3),
('faq', $j${"question":"Как посмотреть демо-доступ?","answer":"Раздел «Демо»: фрагмент видеоурока и вопрос ПДД. Материалы доступны только для просмотра — ответить на билеты можно после входа в личный кабинет."}$j$::jsonb, 4),
('faq', $j${"question":"Где находятся филиалы?","answer":"Три офиса и автодром в Кургане: ул. Станционная, 49 (помещение 49/7), ул. Максима Горького, 41 (офис 4), 4-й микрорайон, 32 и автодром на проспекте Машиностроителей, 38/6. Карта и режим работы — в разделе «Филиалы»."}$j$::jsonb, 5),
('faq', $j${"question":"Как установить сайт на телефон?","answer":"На iPhone — Safari → «Поделиться» → «На экран “Домой”». На Android — Chrome → меню → «Установить приложение». Сайт откроется отдельной страницей, без адресной строки."}$j$::jsonb, 6),

('locations', $j${"name":"Горького","address":"ул. Максима Горького, 41, офис 4","kind":"офис","hours":"Пн–Пт 10:00–19:00","phone":"8 (919) 591-55-58","lat":55.43481,"lng":65.33986}$j$::jsonb, 1),
('locations', $j${"name":"Станционная","address":"ул. Станционная, 49, помещение 49/7","kind":"офис","hours":"Пн–Вс 08:30–20:30","phone":"8 (919) 591-55-58","lat":55.44515,"lng":65.33369}$j$::jsonb, 2),
('locations', $j${"name":"4-й микрорайон","address":"4-й микрорайон, 32","kind":"офис","hours":"Пн–Вс 08:30–20:30","phone":"8 (919) 591-55-58","lat":55.46776,"lng":65.27501}$j$::jsonb, 3),
('locations', $j${"name":"Автодром","address":"проспект Машиностроителей, 38/6","kind":"площадка","hours":"По расписанию занятий","phone":"8 (919) 591-55-58","lat":55.46902,"lng":65.32686}$j$::jsonb, 4);

INSERT INTO home_settings (key, value) VALUES
('demo', $j${"video_url":"/home/reel.mp4","video_title":"Как проходит занятие","video_caption":"Фрагмент съёмки с занятия: автомобиль школы, маршрут и комментарий мастера.","q_label":"Билет 1 · вопрос 7","q_tag":"ПДД РФ","question":"Что означает мигающий жёлтый сигнал светофора?","answers":["Запрещает движение и требует остановиться.","Разрешает движение и информирует о нерегулируемом перекрёстке.","Разрешает движение только направо."]}$j$::jsonb)
ON CONFLICT (key) DO NOTHING;
