import { useState } from "react";
import VectorLogo from "@/components/VectorLogo";
import ChatBot from "@/components/ChatBot";
import Icon from "@/components/ui/icon";

const HERO_IMAGE =
  "https://optim.tildacdn.com/tild6662-3533-4331-b465-383763383535/-/format/webp/Frame_37-2.jpg.webp";
const INSTRUCTOR_IMAGE =
  "https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/files/d6afaec1-319a-4ed5-a659-10842afd4ad7.jpg";

const BOT_FEATURES = [
  {
    icon: "Video",
    title: "Видеоуроки",
    text: "Разборы парковки, манёвров и ПДД с реальными видео прямо в чате.",
  },
  {
    icon: "Map",
    title: "Схемы и иллюстрации",
    text: "Наглядные схемы каждого манёвра — понятно даже без инструктора рядом.",
  },
  {
    icon: "MessageCircle",
    title: "Живой диалог",
    text: "Задайте вопрос — получите пошаговый ответ, как от настоящего инструктора.",
  },
  {
    icon: "Clock",
    title: "Доступен 24/7",
    text: "Учитесь в любое время: ночью перед экзаменом или в обеденный перерыв.",
  },
  {
    icon: "BookOpen",
    title: "Полная программа",
    text: "Парковка, разворот, перекрёстки, экстренное торможение — всё в одном месте.",
  },
  {
    icon: "Shield",
    title: "Экспертный контент",
    text: "Все материалы проверены инструкторами Вектора с опытом 5+ лет.",
  },
];

const WHY_VECTOR = [
  {
    num: "01",
    title: "Знаем, чего боятся в Кургане",
    text: "Инструктора кургановского филиала Вектора собрали самые частые вопросы учеников — и загрузили ответы прямо в бот. Никакой теории ради теории.",
  },
  {
    num: "02",
    title: "Контент от живых инструкторов",
    text: "Каждый урок составлен нашими инструкторами с опытом 5+ лет. Видео, схемы и советы проверены на реальных учениках в Кургане.",
  },
  {
    num: "03",
    title: "Готовит к нашему автодрому",
    text: "Манёвры, схемы и советы заточены под упражнения, которые вы будете сдавать именно на автодроме.",
  },
];

const NAV_LINKS = ["Инструктор", "Преимущества", "О школе", "Контакты"];

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const navMap: Record<string, string> = {
    Инструктор: "bot",
    Преимущества: "features",
    "О школе": "about",
    Контакты: "contacts",
  };

  const openChat = () => {
    const btn = document.querySelector(
      "[data-chatbot-btn]",
    ) as HTMLButtonElement;
    btn?.click();
  };

  return (
    <div className="min-h-screen bg-white font-opensans">
      {/* TOP BAR */}
      <div
        className="hidden md:block py-2 text-sm"
        style={{ background: "#1a1a1a" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-white/60">
          <div className="flex items-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <Icon name="MapPin" size={12} />
              г. Курган, ​4-й микрорайон, 32
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" size={12} />
              Пн–Вс: 8:30–20:30
            </span>
          </div>
          <a
            href="tel:+73522509335"
            className="text-white font-semibold hover:text-[#E8002D] transition-colors flex items-center gap-1.5"
          >
            <Icon name="Phone" size={12} />8 (3522) 50-93-35
          </a>
        </div>
      </div>

      {/* PROMO BANNER */}
      <div
        className="py-2 text-center text-sm font-medium"
        style={{ background: "#E8002D", color: "white" }}
      >
        🎂 Дарим <strong>−1000 ₽</strong> на обучение всем именинникам ·
        Обучение от <strong>24 950 ₽</strong> · Беспроцентная рассрочка
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
                className="text-sm font-medium text-gray-500 hover:text-[#1a1a1a] transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={openChat}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#E8002D", color: "white" }}
            >
              <Icon name="MessageCircle" size={14} />
              Спросить инструктора
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon
                name={mobileMenuOpen ? "X" : "Menu"}
                size={20}
                className="text-gray-700"
              />
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
            <button
              onClick={openChat}
              className="flex items-center gap-2 font-semibold text-sm mt-1"
              style={{ color: "#E8002D" }}
            >
              <Icon name="MessageCircle" size={15} />
              Открыть инструктора
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "580px" }}
      >
        <img
          src={HERO_IMAGE}
          alt="Автошкола Вектор"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(26,26,26,0.96) 0%, rgba(26,26,26,0.80) 50%, rgba(26,26,26,0.15) 100%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 flex flex-col justify-center min-h-[580px]">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 uppercase tracking-widest"
              style={{ background: "#E8002D", color: "white" }}
            >
              <Icon name="Sparkles" size={11} />
              Автошкола Вектор — Курган
            </div>
            <h1
              className="font-montserrat text-4xl md:text-6xl text-white leading-[1.1] mb-5"
              style={{ fontWeight: 900 }}
            >
              Виртуальный
              <br />
              инструктор
              <br />
              <span style={{ color: "#E8002D" }}>всегда рядом</span>
            </h1>
            <p className="text-white/75 text-lg mb-8 leading-relaxed max-w-lg">
              Чат-бот автошколы «Вектор» обучит технике парковки, объяснит
              правила ПДД и покажет видеоуроки — в любое время, бесплатно.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openChat}
                className="flex items-center gap-2 px-7 py-4 rounded-xl text-white font-montserrat shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "#E8002D",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                <Icon name="MessageCircle" size={18} />
                Начать обучение
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="px-7 py-4 rounded-xl text-white/80 border border-white/30 hover:bg-white/10 transition-all font-montserrat text-base"
                style={{ fontWeight: 500 }}
              >
                Узнать больше
              </button>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/15">
              {[
                { val: "от 24 950 ₽", label: "категория B, всё включено" },
                { val: "24/7", label: "инструктор доступен" },
                { val: "−1000 ₽", label: "скидка именинникам" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="font-montserrat text-white text-2xl"
                    style={{ fontWeight: 900, color: "#E8002D" }}
                  >
                    {s.val}
                  </div>
                  <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOT DEMO SECTION */}
      <section id="bot" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: phone mockup */}
            <div className="relative flex justify-center">
              {/* Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-72 h-72 rounded-full opacity-10"
                  style={{ background: "#E8002D", filter: "blur(60px)" }}
                />
              </div>
              {/* Phone frame */}
              <div
                className="relative w-64 bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-[#2a2a2a]"
                style={{ minHeight: 480 }}
              >
                {/* Status bar */}
                <div className="h-8 bg-[#111] flex items-center justify-center">
                  <div className="w-20 h-1 bg-[#333] rounded-full" />
                </div>
                {/* Chat header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: "#1a1a1a" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                    style={{ background: "#E8002D" }}
                  >
                    И
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">
                      Инструктор Вектор
                    </p>
                    <p className="text-white/40 text-[10px]">онлайн</p>
                  </div>
                </div>
                {/* Chat messages */}
                <div
                  className="bg-[#f4f6fa] flex-1 px-3 py-4 flex flex-col gap-3"
                  style={{ minHeight: 360 }}
                >
                  {/* Bot msg */}
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#E8002D" }}
                    >
                      И
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[80%]">
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        Привет! Я инструктор автошколы «Вектор». Что хочешь
                        изучить?
                      </p>
                    </div>
                  </div>
                  {/* Options */}
                  <div className="flex flex-col gap-1.5 pl-8">
                    {[
                      "Параллельная парковка",
                      "Заезд в гараж",
                      "Правила перекрёстков",
                    ].map((opt) => (
                      <div
                        key={opt}
                        className="px-2.5 py-1.5 rounded-full border text-[10px] font-medium"
                        style={{
                          borderColor: "#E8002D",
                          color: "#E8002D",
                          background: "white",
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                  {/* User reply */}
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-tr-sm px-3 py-2 text-white text-[11px] max-w-[75%]"
                      style={{ background: "#E8002D" }}
                    >
                      Параллельная парковка
                    </div>
                  </div>
                  {/* Bot with video */}
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#E8002D" }}
                    >
                      И
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden max-w-[80%]">
                      <div className="relative">
                        <div className="w-full h-16 bg-gray-200 flex items-center justify-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "#E8002D" }}
                          >
                            <Icon
                              name="Play"
                              size={12}
                              className="text-white ml-0.5"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[11px] text-gray-700">
                          Разбор парковки — шаг 1: подъезжаем параллельно...
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Typing */}
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: "#E8002D" }}
                    >
                      И
                    </div>
                    <div className="bg-white rounded-2xl px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: text */}
            <div>
              <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-3">
                Чат-бот инструктора
              </p>
              <h2
                className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a] mb-5 leading-tight"
                style={{ fontWeight: 900 }}
              >
                Учитесь в любое
                <br />
                время и в любом месте
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Не нужно ждать урока, чтобы разобрать непонятный манёвр.
                Откройте чат — инструктор уже ждёт вас с объяснениями, видео и
                схемами.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: "Video",
                    text: "Видеоуроки по каждому манёвру — сразу в диалоге",
                  },
                  {
                    icon: "Map",
                    text: "Схемы парковки, разворотов, проезда перекрёстков",
                  },
                  {
                    icon: "CheckCircle",
                    text: "Советы по подготовке к экзамену в ГИБДД",
                  },
                  { icon: "Zap", text: "Мгновенные ответы без ожидания" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#fff0f2" }}
                    >
                      <Icon
                        name={item.icon}
                        size={16}
                        className="text-[#E8002D]"
                        fallback="Check"
                      />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed pt-1.5">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={openChat}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-montserrat transition-all hover:opacity-90"
                style={{ background: "#E8002D", fontWeight: 700 }}
              >
                <Icon name="MessageCircle" size={17} />
                Открыть инструктора
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BOT FEATURES */}
      <section
        id="features"
        style={{ background: "#f7f7f7" }}
        className="py-20 md:py-28"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-3">
              Возможности
            </p>
            <h2
              className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a]"
              style={{ fontWeight: 900 }}
            >
              Что умеет наш инструктор
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOT_FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#fff0f2" }}
                >
                  <Icon
                    name={f.icon}
                    size={20}
                    className="text-[#E8002D]"
                    fallback="Star"
                  />
                </div>
                <h3
                  className="font-montserrat text-base text-[#1a1a1a] mb-2"
                  style={{ fontWeight: 700 }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={openChat}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-montserrat transition-all hover:opacity-90 shadow-lg"
              style={{ background: "#E8002D", fontWeight: 700 }}
            >
              <Icon name="MessageCircle" size={18} />
              Открыть Инструктора
            </button>
          </div>
        </div>
      </section>

      {/* WHY VECTOR */}
      <section id="about" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-3">
                Почему именно Вектор
              </p>
              <h2
                className="font-montserrat text-3xl md:text-4xl text-[#1a1a1a] mb-8 leading-tight"
                style={{ fontWeight: 900 }}
              >
                Бот, созданный
                <br />
                настоящими инструкторами
              </h2>
              <div className="space-y-7">
                {WHY_VECTOR.map((item) => (
                  <div key={item.num} className="flex gap-5">
                    <div
                      className="font-montserrat text-3xl flex-shrink-0 leading-none"
                      style={{ fontWeight: 900, color: "#f0f0f0" }}
                    >
                      {item.num}
                    </div>
                    <div>
                      <h3
                        className="font-montserrat text-base text-[#1a1a1a] mb-1.5"
                        style={{ fontWeight: 700 }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div
                className="absolute -top-6 -right-6 w-48 h-48 rounded-full opacity-5"
                style={{ background: "#E8002D" }}
              />
              <img
                src={INSTRUCTOR_IMAGE}
                alt="Инструктор Вектор"
                className="relative rounded-3xl shadow-2xl w-full object-cover"
                style={{ maxHeight: "420px" }}
              />
              {/* Badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100">
                <div
                  className="font-montserrat text-3xl text-[#1a1a1a] leading-none"
                  style={{ fontWeight: 900 }}
                >
                  10 лет
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  Федеральная академия
                  <br />
                  вождения
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOPICS — что можно спросить */}
      <section style={{ background: "#1a1a1a" }} className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-3">
              Темы обучения
            </p>
            <h2
              className="font-montserrat text-3xl md:text-4xl text-white"
              style={{ fontWeight: 900 }}
            >
              Спросите инструктора о...
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {[
              { icon: "ParkingSquare", label: "Параллельная парковка" },
              { icon: "Warehouse", label: "Заезд в гараж" },
              { icon: "RotateCcw", label: "Разворот" },
              { icon: "GitFork", label: "Перекрёстки" },
              { icon: "AlertTriangle", label: "Экстренное торможение" },
            ].map((t) => (
              <button
                key={t.label}
                onClick={openChat}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 hover:border-[#E8002D]/50 hover:bg-white/5 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-[#E8002D] transition-colors"
                  style={{ background: "rgba(232,0,45,0.15)" }}
                >
                  <Icon
                    name={t.icon}
                    size={22}
                    className="text-[#E8002D] group-hover:text-white"
                    fallback="BookOpen"
                  />
                </div>
                <span className="text-white/70 text-xs text-center leading-snug group-hover:text-white transition-colors font-medium">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={openChat}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-montserrat transition-all hover:opacity-90"
              style={{ background: "#E8002D", fontWeight: 700 }}
            >
              <Icon name="MessageCircle" size={18} />
              Начать диалог
            </button>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section
        id="contacts"
        className="py-16 md:py-20"
        style={{ background: "#f7f7f7" }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#E8002D] text-sm font-semibold uppercase tracking-widest mb-3">
            Автошкола Вектор — Курган
          </p>
          <h2
            className="font-montserrat text-2xl md:text-3xl text-[#1a1a1a] mb-2"
            style={{ fontWeight: 800 }}
          >
            Федеральная академия вождения
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Обучение категории B от 24 950 ₽ · Беспроцентная рассрочка · −1000 ₽
            именинникам
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: "MapPin",
                label: "Адрес",
                value: "г. Курган\​4-й микрорайон, 32",
              },
              {
                icon: "Phone",
                label: "Телефон ",
                value: "8 (3522) 50-93-35",
                href: "tel:83522509335",
              },
              {
                icon: "Clock",
                label: "Режим работы",
                value: "Пн–Вс: 8:30–20:30",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "#fff0f2" }}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className="text-[#E8002D]"
                    fallback="Info"
                  />
                </div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="font-semibold text-[#1a1a1a] hover:text-[#E8002D] transition-colors whitespace-pre-line text-sm"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="font-semibold text-[#1a1a1a] whitespace-pre-line text-sm">
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
          <a
            href="tel:83522509335"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-montserrat transition-all hover:opacity-90"
            style={{ background: "#1a1a1a", fontWeight: 600 }}
          >
            <Icon name="Phone" size={16} />
            Позвонить в автошколу
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111" }} className="py-7">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <VectorLogo size="sm" inverted />
          <p className="text-white/30 text-xs text-center">
            © 2026 Федеральная академия вождения «Вектор» · г. Курган. Все
            права защищены.
          </p>
          <div className="flex gap-5">
            {["Инструктор", "О школе", "Контакты"].map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(navMap[link] || "about")}
                className="text-white/40 hover:text-white/70 text-xs transition-colors"
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
