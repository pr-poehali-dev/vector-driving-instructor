export interface ChatMessage {
  id: string;
  role: 'instructor' | 'user';
  text: string;
  video?: { title: string; url: string; thumb: string };
  image?: { src: string; caption: string };
  options?: string[];
  delay?: number;
}

export interface ChatTopic {
  id: string;
  label: string;
  icon: string;
  messages: ChatMessage[];
}

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'instructor',
  text: 'Здравствуйте! Я ваш инструктор автошколы «Вектор». Готов помочь с обучением вождению. Выберите тему, которая вас интересует:',
  options: ['Параллельная парковка', 'Заезд в гараж', 'Разворот в ограниченном пространстве', 'Правила проезда перекрёстков', 'Экстренное торможение'],
};

export const TOPICS: ChatTopic[] = [
  {
    id: 'parallel-parking',
    label: 'Параллельная парковка',
    icon: 'ParkingSquare',
    messages: [
      {
        id: 'pp1',
        role: 'instructor',
        text: 'Параллельная парковка — один из самых важных навыков. Разберём пошагово.',
      },
      {
        id: 'pp2',
        role: 'instructor',
        text: '📌 Шаг 1: Подъезжайте параллельно автомобилю спереди на расстоянии 50–70 см, выровняйте задние бамперы.',
        image: {
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Parallel_parking_sequence.svg/640px-Parallel_parking_sequence.svg.png',
          caption: 'Схема параллельной парковки',
        },
      },
      {
        id: 'pp3',
        role: 'instructor',
        text: '📌 Шаг 2: Включите заднюю передачу. Поворачивайте руль вправо до упора и медленно двигайтесь назад до угла 45°.',
      },
      {
        id: 'pp4',
        role: 'instructor',
        text: '📌 Шаг 3: Выровняйте руль и продолжайте движение назад, пока передний бампер не поравняется с задним бампером переднего авто.',
      },
      {
        id: 'pp5',
        role: 'instructor',
        text: '📌 Шаг 4: Поверните руль влево до упора и заканчивайте манёвр. Центруйте авто в парковочном месте.',
      },
      {
        id: 'pp6',
        role: 'instructor',
        text: '🎬 Посмотрите видеоурок по параллельной парковке:',
        video: {
          title: 'Параллельная парковка — полный разбор',
          url: 'https://www.youtube.com/embed/tT0fZm2jMD4',
          thumb: 'https://img.youtube.com/vi/tT0fZm2jMD4/hqdefault.jpg',
        },
      },
      {
        id: 'pp7',
        role: 'instructor',
        text: '✅ Главное правило: не торопитесь! Скорость при парковке — пешеходная. Что ещё хотите разобрать?',
        options: ['Заезд в гараж', 'Разворот в ограниченном пространстве', 'Правила перекрёстков'],
      },
    ],
  },
  {
    id: 'garage-parking',
    label: 'Заезд в гараж',
    icon: 'Warehouse',
    messages: [
      {
        id: 'gp1',
        role: 'instructor',
        text: 'Заезд в гараж задним ходом — навык, который требует точности. Объясняю технику.',
      },
      {
        id: 'gp2',
        role: 'instructor',
        text: '📌 Подготовка: встаньте перед гаражом на расстоянии 2–3 метра, выровняйте автомобиль по оси ворот.',
        image: {
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Reverse_parking_sequence.svg/640px-Reverse_parking_sequence.svg.png',
          caption: 'Заезд в гараж задним ходом',
        },
      },
      {
        id: 'gp3',
        role: 'instructor',
        text: '📌 Движение: включите заднюю передачу, смотрите в зеркала попеременно. Скорость — медленнее шага. Используйте ориентиры на воротах.',
      },
      {
        id: 'gp4',
        role: 'instructor',
        text: '📌 Ориентиры: когда в зеркале заднего вида видите оба края ворот на равном расстоянии — вы едете прямо.',
      },
      {
        id: 'gp5',
        role: 'instructor',
        text: '🎬 Видеоурок: заезд в гараж с первого раза:',
        video: {
          title: 'Заезд в гараж задним ходом',
          url: 'https://www.youtube.com/embed/wNBfFBxH0PM',
          thumb: 'https://img.youtube.com/vi/wNBfFBxH0PM/hqdefault.jpg',
        },
      },
      {
        id: 'gp6',
        role: 'instructor',
        text: '✅ Практикуйтесь на открытой площадке, ставя конусы. Что ещё разберём?',
        options: ['Параллельная парковка', 'Разворот', 'Правила перекрёстков'],
      },
    ],
  },
  {
    id: 'u-turn',
    label: 'Разворот',
    icon: 'RotateCcw',
    messages: [
      {
        id: 'ut1',
        role: 'instructor',
        text: 'Разворот в ограниченном пространстве — обязательный элемент экзамена. Покажу технику.',
      },
      {
        id: 'ut2',
        role: 'instructor',
        text: '📌 Разворот за 3 приёма: 1) Выезд вперёд с поворотом руля; 2) Задний ход с поворотом в обратную сторону; 3) Выезд вперёд с выравниванием.',
        image: {
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Three-point_turn.svg/640px-Three-point_turn.svg.png',
          caption: 'Схема разворота за 3 приёма',
        },
      },
      {
        id: 'ut3',
        role: 'instructor',
        text: '⚠️ Важно: перед каждым движением проверяйте зеркала и слепые зоны. Убедитесь, что дорога свободна не менее чем на 50 метров в каждую сторону.',
      },
      {
        id: 'ut4',
        role: 'instructor',
        text: '🎬 Видео: разворот в узком месте — пошагово:',
        video: {
          title: 'Разворот в 3 приёма',
          url: 'https://www.youtube.com/embed/VHFbtiLUPl0',
          thumb: 'https://img.youtube.com/vi/VHFbtiLUPl0/hqdefault.jpg',
        },
      },
      {
        id: 'ut5',
        role: 'instructor',
        text: '✅ Запомните: спешка — главная ошибка. Манёвр должен быть плавным и контролируемым.',
        options: ['Параллельная парковка', 'Заезд в гараж', 'Экстренное торможение'],
      },
    ],
  },
  {
    id: 'intersections',
    label: 'Правила перекрёстков',
    icon: 'GitFork',
    messages: [
      {
        id: 'in1',
        role: 'instructor',
        text: 'Перекрёстки — самые аварийные места. Разберём правила приоритета.',
      },
      {
        id: 'in2',
        role: 'instructor',
        text: '📌 Правило «помехи справа»: на равнозначном перекрёстке уступайте тому, кто едет справа от вас.',
      },
      {
        id: 'in3',
        role: 'instructor',
        text: '📌 Главная дорога: если вы на второстепенной — уступите всем, кто на главной, независимо от направления их движения.',
      },
      {
        id: 'in4',
        role: 'instructor',
        text: '📌 Поворот налево: при повороте налево уступайте встречному транспорту, движущемуся прямо или направо.',
        image: {
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Left_turn_on_green.svg/640px-Left_turn_on_green.svg.png',
          caption: 'Приоритет при повороте налево',
        },
      },
      {
        id: 'in5',
        role: 'instructor',
        text: '🎬 Видеоурок — правила проезда перекрёстков:',
        video: {
          title: 'Правила проезда перекрёстков',
          url: 'https://www.youtube.com/embed/nLv-F63BVfE',
          thumb: 'https://img.youtube.com/vi/nLv-F63BVfE/hqdefault.jpg',
        },
      },
      {
        id: 'in6',
        role: 'instructor',
        text: '✅ Золотое правило: лучше подождать лишнюю секунду, чем создать аварийную ситуацию.',
        options: ['Параллельная парковка', 'Экстренное торможение', 'Разворот'],
      },
    ],
  },
  {
    id: 'emergency-braking',
    label: 'Экстренное торможение',
    icon: 'AlertTriangle',
    messages: [
      {
        id: 'eb1',
        role: 'instructor',
        text: 'Экстренное торможение — навык, который может спасти жизнь. Изучим технику.',
      },
      {
        id: 'eb2',
        role: 'instructor',
        text: '📌 На автомобиле с ABS: нажмите педаль тормоза резко и до упора. Не отпускайте! ABS сама предотвратит блокировку колёс.',
      },
      {
        id: 'eb3',
        role: 'instructor',
        text: '📌 Без ABS: нажимайте тормоз прерывисто (педаль — отпустить — педаль) или с нарастающим усилием, чтобы не заблокировать колёса.',
      },
      {
        id: 'eb4',
        role: 'instructor',
        text: '⚠️ Важно: руки держите прямо! При торможении не поворачивайте руль — это вызовет занос.',
      },
      {
        id: 'eb5',
        role: 'instructor',
        text: '🎬 Видео: техника экстренного торможения:',
        video: {
          title: 'Экстренное торможение — техника',
          url: 'https://www.youtube.com/embed/TGhYMjwfO4Y',
          thumb: 'https://img.youtube.com/vi/TGhYMjwfO4Y/hqdefault.jpg',
        },
      },
      {
        id: 'eb6',
        role: 'instructor',
        text: '✅ Помните о безопасной дистанции: при 60 км/ч — минимум 30 метров до впереди идущего автомобиля.',
        options: ['Параллельная парковка', 'Правила перекрёстков', 'Разворот'],
      },
    ],
  },
];

export const TOPIC_MAP: Record<string, string> = {
  'Параллельная парковка': 'parallel-parking',
  'Заезд в гараж': 'garage-parking',
  'Разворот в ограниченном пространстве': 'u-turn',
  'Разворот': 'u-turn',
  'Правила проезда перекрёстков': 'intersections',
  'Правила перекрёстков': 'intersections',
  'Экстренное торможение': 'emergency-braking',
};