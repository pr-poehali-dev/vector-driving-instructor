-- Дополняем набор категорий ПДД до официальных тем экзаменационных билетов ГИБДД
INSERT INTO t_p22961065_vector_driving_instr.pdd_categories (slug, label, icon, sort_order) VALUES
('nachalo-dvizheniya', 'Начало движения, манёврирование', 'Navigation', 7),
('raspolozhenie', 'Расположение ТС на проезжей части', 'AlignHorizontalJustifyCenter', 8),
('skorost', 'Скорость движения', 'Gauge', 9),
('obgon', 'Обгон, встречный разъезд', 'ArrowLeftRight', 10),
('ostanovka-stoyanka', 'Остановка и стоянка', 'ParkingCircle', 11),
('prioritet-transporta', 'Приоритет маршрутных ТС', 'Bus', 12),
('perevozka-passazhirov', 'Перевозка людей и грузов', 'Users', 13),
('neispravnosti', 'Неисправности и условия эксплуатации', 'Wrench', 14),
('otvetstvennost', 'Ответственность водителя', 'Scale', 15),
('bezopasnost', 'Основы безопасности движения', 'ShieldCheck', 16);
