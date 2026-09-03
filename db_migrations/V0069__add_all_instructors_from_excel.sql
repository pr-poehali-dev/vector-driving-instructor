-- Обновляем существующего Зуева Романа на нормальный логин/пароль
UPDATE instructors SET name='Зуев Роман', login='zuev', password_hash='3a3db04e9cc4bca1d494d3a43eb749f6504e7cf1dfdbe4675aebf53afd28491a', branch_id=1 WHERE login='1';

-- Добавляем остальных мастеров
INSERT INTO instructors (name, login, password_hash, branch_id, car_model) VALUES
('Бруштеля Андрей', 'brushtelya', '578a8284778c318c78aa5e6fb43927d5b8863ac3ce77392c7fe72da651ffc0f1', 1, ''),
('Бушмин Михаил', 'bushmin', '6f4fc66f02fee5003accc8afe83cbdc8cfbd5fc172fb5d45ef80d810c83deb78', 1, ''),
('Дулебов Илья', 'dulebov', '1e6547e02a24a5dca05be77b417f3e7db09f80166ee48f6ac57e4d2172922d39', 1, ''),
('Петров Данил', 'petrov', '2f1f79a8f9b3b23052677e132f0b6caa94c3689a046a31a137f7b50d7465681f', 1, ''),
('Попов Сергей', 'popov', '79bf1c88bf8e4c31e0d779b6787eac9a8d587855dbafdc68533813e556699086', 1, ''),
('Родькин Петр', 'rodkin', 'bf26df98476d906dddb55c825cbfc4dfbbdce89bacf5049911cf699216968b18', 1, ''),
('Федулов Максим', 'fedulov', 'c6e97096dc8ce9ceaa2235259e9002cd77eca0b0d0b78b5b6fc2d30558694c25', 1, ''),
('Чабан Алексей', 'chaban', '31005965b9dc041d01a271b656201e1cec6e43cf70eda2cda9764de94ee528ea', 1, ''),
('Ветров Глеб', 'vetrov', 'f540b6a5c01d28f496202312fb5bfef0ebb692a465fc18b391e1986d0d66de1a', 3, ''),
('Голоднов Александр', 'golodnov', 'fda62c70400ad00e47878a996b776fdd163662862c2897579d854b7b5c24e69d', 3, ''),
('Гордеев Григорий', 'gordeev', 'b0d4c78503610ca11b4e084477b75a730130349579dbdcaf6164e58faec79cd9', 3, ''),
('Дмитриева Елена', 'dmitrieva', 'daf80745c3d4c942aa76f5c810e592664f4a2f849b7d438b0f02f77daaec67e9', 3, ''),
('Журба Татьяна', 'zhurba', 'b791c6d21ffed4ff57473cb65e75652932da1811ba25c60fd85884268b6c5b67', 3, ''),
('Иванов Олег', 'ivanov', 'c666ced6d7e4b7a2997a9d4c38a469f11284ea223f4f0d68bf99f00e5c5add2f', 3, ''),
('Каргапольцев Павел', 'kargapolcev', '48a36332e56565a01f42f0ed923504528a1edb9c541e53c3d2ccc6c395249785', 3, ''),
('Крюков Константин', 'kryukov', '9e4f919320e218dedf3991a6024b6e3fa5c8651319b30fc5445950cc73b60b3c', 3, ''),
('Падалко Дмитрий', 'padalko', '84389e610d8c70004229d94e933c61094e5bcb33246d7be05756cc944071d823', 3, ''),
('Печерских Антон', 'pecherskih', '3d68f1cb6055efd73c6ddfd407bc6256d9a7118e8ae5736f03c4bf7099f79b80', 3, ''),
('Статных Евгений', 'statnyh', '49111f4a44f1920a48097dd63b1a6211d231b2d7ee088aa2d50aaf1c983f161c', 3, ''),
('Ярков Александр', 'yarkov', 'c1600b0070096be9d0ccac493a9678bc062e2168c42cf6fec57da959320f147b', 3, ''),
('Девяткин Андрей', 'devyatkin', 'a01099d821974609efafa894f196ccacce82c3938ff63e424f5f19541a34e634', 4, ''),
('Мальцев Василий', 'malcev', 'e5bdcf06de5ae9ccc40b41fa1621be4d96f978f36e4ed80eb6bd9f55f81a2f97', 4, '')
ON CONFLICT (login) DO NOTHING;
