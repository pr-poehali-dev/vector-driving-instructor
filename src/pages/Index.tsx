import { useState } from 'react';
import VectorLogo from '@/components/VectorLogo';
import ChatBot from '@/components/ChatBot';
import Icon from '@/components/ui/icon';

const HERO_IMAGE = 'https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/files/9c2d672a-71d5-4a7f-af31-d123f0f2e78d.jpg';
const INSTRUCTOR_IMAGE = 'https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/files/d6afaec1-319a-4ed5-a659-10842afd4ad7.jpg';

const STATS = [
  { value: '9+', label: 'лет на рынке' },
  { value: '10 000+', label: 'выпускников' },
  { value: '96%', label: 'сдают с первого раза' },
  { value: '18', label: 'опытных инструкторов' },
];

const ADVANTAGES = [
  {
    icon: 'Laptop',
    title: 'IT-автошкола',
    text: 'Первая IT-автошкола в Омске. Онлайн-теория, личный кабинет, мобильное приложение — учитесь где удобно.',
  },
  {
    icon: 'Car',
    title: 'Современный автопарк',
    text: 'Автомобили с двойными педалями: LADA Granta, Hyundai Solaris, KIA Rio. Все оснащены видеорегистраторами.',
  },
  {
    icon: 'Heart',
    title: 'Без страха за руль',
    text: 'Психологически комфортная атмосфера. Инструкторы не кричат, не давят. Учим с удовольствием.',
  },
  {
    icon: 'Clock',
    title: 'Удобное расписание',
    text: 'Занятия 7 дней в неделю с 8:00 до 21:00. Утренние, дневные и вечерние группы.',
  },
  {
    icon: 'MapPin',
    title: 'Удобное расположение',
    text: '2 учебных класса в центре Омска: ул. Гагарина 14 и ул. Кирова 47. Рядом автодром.',
  },
  {
    icon: 'Award',
    title: 'Лицензия МВД',
    text: 'Официальная государственная лицензия. Аккредитованы Сколково как инновационная компания.',
  },
];

const COURSES = [
  {
    category: 'B',
    title: 'Вектор Старт',
    subtitle: 'Категория B — легковой автомобиль',
    price: 'от 26 900 ₽',
    duration: '3 месяца',
    hours: '130 ч. теории + 56 ч. практики',
    features: ['Онлайн-теория ПДД', 'Личный кабинет', 'Вождение в городе', 'Автодром', 'Сопровождение на экзамен в ГИБДД'],
    popular: true,
  },
  {
    category: 'B+',
    title: 'Вектор Black',
    subtitle: 'Премиум-пакет • BMW / Tesla',
    price: 'от 49 900 ₽',
    duration: '3 месяца',
    hours: '130 ч. теории + 56 ч. практики',
    features: ['Всё из пакета Старт', 'Вождение на BMW или Tesla', 'Персональный инструктор', 'Приоритетное расписание'],
    popular: false,
  },
];

const REVIEWS = [
  {
    name: 'Анна К.',
    date: 'март 2025',
    text: 'Сдала с первого раза! Инструктор Михаил очень терпелив и профессионален. Объяснял всё понятно, не давил психологически.',
    stars: 5,
  },
  {
    name: 'Дмитрий П.',
    date: 'февраль 2025',
    text: 'Отличная автошкола. Современные авто, удобный график. Теория онлайн — очень удобно. Рекомендую всем!',
    stars: 5,
  },
  {
    name: 'Светлана М.',
    date: 'январь 2025',
    text: 'Боялась вождения, но инструктор помог преодолеть страх. Теперь езжу уверенно. Спасибо команде Вектор!',
    stars: 5,
  },
];

const NAV_LINKS = ['О школе', 'Курсы', 'Преимущества', 'Отзывы', 'Контакты'];

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navMap: Record<string, string> = {
    'О школе': 'about',
    'Курсы': 'courses',
    'Преимущества': 'advantages',
    'Отзывы': 'reviews',
    'Контакты': 'contacts',
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] font-opensans">

      {/* TOP BAR */}
      <div className="hidden md:block py-2 text-sm" style={{ background: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-white/60">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Icon name="MapPin" size={13} />
              г. Омск, ул. Гагарина 14 / ул. Кирова 47
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" size={13} />
              Пн–Вс: 8:00–21:00
            </span>
          </div>
          <a href="tel:88005056377" className="text-white font-semibold text-base hover:text-[#E8002D] transition-colors flex items-center gap-1.5">
            <Icon name="Phone" size={13} />
            8 (800) 505-63-77 — бесплатно
          </a>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <VectorLogo size="sm" />

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(navMap[link])}
                className="text-sm font-medium text-gray-600 hover:text-[#1a1a1a] transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="tel:88005056377"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#E8002D', color: 'white' }}
            >
              <Icon name="Phone" size={14} />
              Позвонить
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3 animate-fade-in">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(navMap[link])}
                className="text-left text-sm font-medium text-gray-700 py-1.5 border-b border-gray-50"
              >
                {link}
              </button>
            ))}
            <a href="tel:88005056377" className="flex items-center gap-2 text-[#E8002D] font-semibold text-sm mt-1">
              <Icon name="Phone" size={15} />
              8 (800) 505-63-77
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="about" className="relative overflow-hidden" style={{ minHeight: '560px' }}>
        <img
          src={HERO_IMAGE}
          alt="Автошкола Вектор"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(26,26,26,0.94) 0%, rgba(26,26,26,0.75) 55%, rgba(26,26,26,0.20) 100%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 flex flex-col justify-center min-h-[560px]">
          <div className="max-w-xl animate-slide-up">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-wider"
              style={{ background: '#E8002D', color: 'white' }}
            >
              <Icon name="Heart" size={11} />
              Первая IT-автошкола в Омске
            </div>
            <h1
              className="font-montserrat text-4xl md:text-5xl text-white leading-tight mb-4"
              style={{ fontWeight: 900 }}
            >
              Академия вождения<br />
              <span style={{ color: '#E8002D' }}>Вектор</span>
            </h1>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Обучаем с любовью ❤️ — без крика, без страха. 10 000+ выпускников с 2015 года. Онлайн-теория, персональный инструктор, вождение в городе.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo('courses')}
                className="px-6 py-3.5 rounded-lg text-white text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 font-montserrat"
                style={{ background: '#E8002D', fontWeight: 700 }}
              >
                Записаться на обучение
              </button>
              <a
                href="tel:88005056377"
                className="px-6 py-3.5 rounded-lg text-white text-base border border-white/40 hover:bg-white/10 transition-all font-montserrat"
                style={{ fontWeight: 600 }}
              >
                8 (800) 505-63-77
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="absolute bottom-0 left-0 right-0 hidden md:block">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-4 divide-x divide-white/20 bg-white/10 backdrop-blur-sm border-t border-white/20 rounded-t-xl overflow-hidden">
                {STATS.map((stat) => (
                  <div key={stat.label} className="px-6 py-4 text-center">
                    <div className="font-montserrat text-3xl text-white mb-0.5" style={{ fontWeight: 900, color: '#f5a623' }}>
                      {stat.value}
                    </div>
                    <div className="text-white/70 text-xs uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile stats */}
      <div className="md:hidden grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-4 text-center">
            <div className="font-montserrat text-2xl mb-0.5" style={{ fontWeight: 800, color: '#1a1a1a' }}>
              {stat.value}
            </div>
            <div className="text-gray-500 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* COURSES */}
      <section id="courses" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-2">Программы обучения</p>
            <h2 className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a]" style={{ fontWeight: 800 }}>
              Выберите свой курс
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {COURSES.map((course) => (
              <div
                key={course.category}
                className={`relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  course.popular ? 'ring-2 ring-[#E8002D]' : ''
                }`}
              >
                {course.popular && (
                  <div
                    className="absolute top-0 left-0 right-0 text-center py-1.5 text-xs font-semibold text-white uppercase tracking-widest"
                    style={{ background: '#E8002D' }}
                  >
                    Самый популярный
                  </div>
                )}
                <div className={`px-6 ${course.popular ? 'pt-10' : 'pt-6'} pb-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-montserrat text-xl text-white mb-3"
                        style={{ background: '#1a1a1a', fontWeight: 900 }}
                      >
                        {course.category}
                      </div>
                      <h3 className="font-montserrat text-xl text-[#1a1a1a]" style={{ fontWeight: 700 }}>
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{course.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-montserrat text-2xl text-[#E8002D]" style={{ fontWeight: 800 }}>
                        {course.price}
                      </div>
                      <div className="text-gray-400 text-xs">{course.duration}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">{course.hours}</p>

                  <ul className="space-y-2 mb-6">
                    {course.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#1a1a1a' }}
                        >
                          <Icon name="Check" size={10} className="text-white" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => scrollTo('contacts')}
                    className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-90 font-montserrat"
                    style={{
                      background: course.popular ? '#E8002D' : '#1a1a1a',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    Записаться
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-2">Почему выбирают нас</p>
            <h2 className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a]" style={{ fontWeight: 800 }}>
              Наши преимущества
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map((adv) => (
              <div
                key={adv.title}
                className="group p-6 rounded-2xl bg-[#f4f6fa] hover:bg-[#1a1a1a] transition-all duration-300 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:bg-[#E8002D]"
                  style={{ background: '#1a1a1a' }}
                >
                  <Icon name={adv.icon} size={22} className="text-white" fallback="Star" />
                </div>
                <h3
                  className="font-montserrat text-base text-[#1a1a1a] group-hover:text-white mb-2 transition-colors"
                  style={{ fontWeight: 700 }}
                >
                  {adv.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-white/70 transition-colors leading-relaxed">
                  {adv.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTRUCTOR CHATBOT PROMO */}
      <section className="py-16 md:py-24" style={{ background: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#f5a623] text-sm font-semibold uppercase tracking-widest mb-3">Онлайн-обучение</p>
              <h2 className="font-montserrat text-3xl md:text-4xl text-white mb-5" style={{ fontWeight: 800 }}>
                Чат-бот инструктора
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                Не ждите занятия — учитесь прямо сейчас. Виртуальный инструктор объяснит технику парковки, манёвров и правил ПДД с видеоуроками и схемами.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Видеоуроки по парковке и манёврам',
                  'Схемы и иллюстрации',
                  'Советы по сдаче экзамена',
                  'Правила дорожного движения',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E8002D' }}>
                      <Icon name="Check" size={11} className="text-white" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90 font-montserrat"
                style={{ background: '#E8002D', fontWeight: 600 }}
                onClick={() => {
                  const btn = document.querySelector('[data-chatbot-btn]') as HTMLButtonElement;
                  btn?.click();
                }}
              >
                <Icon name="MessageCircle" size={16} />
                Открыть инструктора
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20" style={{ background: '#E8002D' }} />
              <img
                src={INSTRUCTOR_IMAGE}
                alt="Инструктор"
                className="relative rounded-2xl shadow-2xl w-full object-cover"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute -bottom-4 -right-4 bg-[#E8002D] text-white rounded-2xl px-5 py-3 shadow-xl">
                <div className="font-montserrat text-2xl" style={{ fontWeight: 800 }}>97%</div>
                <div className="text-white/80 text-xs">сдают с первого раза</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-2">Отзывы курсантов</p>
            <h2 className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a]" style={{ fontWeight: 800 }}>
              Что говорят ученики
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((review) => (
              <div key={review.name} className="bg-[#f4f6fa] rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Icon key={i} name="Star" size={14} className="text-[#f5a623]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">«{review.text}»</p>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: '#1a1a1a' }}
                    >
                      {review.name[0]}
                    </div>
                    <span className="font-semibold text-sm text-[#1a1a1a]">{review.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-16 md:py-24" style={{ background: '#f4f6fa' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-2">Запись на обучение</p>
            <h2 className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a]" style={{ fontWeight: 800 }}>
              Свяжитесь с нами
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-5">
              {[
                { icon: 'MapPin', label: 'Адрес 1', value: 'г. Омск, ул. Гагарина 14, оф. 605' },
                { icon: 'MapPin', label: 'Адрес 2', value: 'г. Омск, ул. Кирова 47' },
                { icon: 'Phone', label: 'Телефон (бесплатно)', value: '8 (800) 505-63-77', href: 'tel:88005056377' },
                { icon: 'Clock', label: 'Режим работы', value: 'Пн–Вс: 8:00–21:00' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                    <Icon name={item.icon} size={18} className="text-white" fallback="Info" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-semibold text-[#1a1a1a] hover:text-[#E8002D] transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-semibold text-[#1a1a1a]">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <a href="https://vk.com" target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: '#1a1a1a' }}>
                  <span className="text-white text-xs font-bold">VK</span>
                </a>
                <a href="https://t.me" target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: '#1a1a1a' }}>
                  <Icon name="Send" size={16} className="text-white" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-montserrat text-lg text-[#1a1a1a] mb-5" style={{ fontWeight: 700 }}>
                Записаться на обучение
              </h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ваше имя</label>
                  <input
                    type="text"
                    placeholder="Иван Иванов"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a1a1a] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a1a1a] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Категория</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a1a1a] transition-colors bg-white">
                    <option>Категория B (легковой авто)</option>
                    <option>Категория A (мотоцикл)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90 font-montserrat"
                  style={{ background: '#E8002D', fontWeight: 600 }}
                >
                  Отправить заявку
                </button>
                <p className="text-center text-xs text-gray-400">
                  Нажимая кнопку, вы соглашаетесь с <a href="#" className="underline">политикой конфиденциальности</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1a1a1a' }} className="py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <VectorLogo size="sm" inverted />
          <p className="text-white/40 text-xs text-center">
            © 2026 Автошкола «Вектор». Лицензия МВД. Все права защищены.
          </p>
          <div className="flex gap-5">
            {NAV_LINKS.slice(0, 3).map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(navMap[link])}
                className="text-white/50 hover:text-white/80 text-xs transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}