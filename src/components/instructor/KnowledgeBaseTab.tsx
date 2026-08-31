import { useState } from 'react';
import Icon from '@/components/ui/icon';

const DEFENSIVE_RULES = [
  { icon: 'Timer', title: '15-секундное планирование траектории', text: 'Постоянно смотрите вперёд на 15 секунд движения (примерно квартал в городе). Это даёт время заметить опасность и спокойно на неё среагировать, а не тормозить экстренно.' },
  { icon: 'RotateCw', title: 'Круговой обзор обстановки', text: 'Каждые 5–8 секунд оценивайте всю обстановку вокруг: зеркала, слепые зоны, обочины. Не фиксируйте взгляд только на дороге впереди.' },
  { icon: 'Eye', title: 'Подвижность взгляда', text: 'Взгляд должен постоянно двигаться — от приборной панели к дороге, к зеркалам и обратно. Неподвижный взгляд «в одну точку» — главный признак потери контроля над ситуацией.' },
  { icon: 'Shield', title: 'Пространство безопасности вокруг авто', text: 'Всегда оставляйте пути отхода — свободное пространство спереди, сзади и хотя бы с одной стороны. Дистанция должна позволять уйти от внезапной опасности.' },
  { icon: 'Users', title: 'Контакт глазами', text: 'На пешеходных переходах и нерегулируемых перекрёстках устанавливайте зрительный контакт с пешеходами и другими водителями — это подтверждает, что вас заметили.' },
];

const SERVICE_RULES = [
  'Обращайтесь к ученику по имени, говорите спокойным и доброжелательным тоном на протяжении всего урока.',
  'Хвалите за успехи сразу, ошибки разбирайте мягко и конструктивно, без повышения голоса.',
  'Не отвлекайтесь на личный телефон во время вождения — ученик должен чувствовать полное внимание инструктора.',
  'При конфликтной ситуации не спорьте на эмоциях — переносите обсуждение на паузу после занятия и подключайте администратора при необходимости.',
  'Начинайте и заканчивайте занятие точно по расписанию, предупреждайте заранее об изменениях.',
];

const EXAM_CHECKLIST = [
  { mistake: 'Не пристегнул ремень безопасности перед началом движения', penalty: 'Снятие с экзамена' },
  { mistake: 'Проезд на запрещающий сигнал светофора или жест регулировщика', penalty: 'Снятие с экзамена' },
  { mistake: 'Непредоставление преимущества пешеходу на переходе', penalty: 'Снятие с экзамена' },
  { mistake: 'Выезд на полосу встречного движения в неположенном месте', penalty: 'Снятие с экзамена' },
  { mistake: 'Неправильное расположение ТС на проезжей части', penalty: '3 штрафных балла' },
  { mistake: 'Нарушение правил перестроения', penalty: '3 штрафных балла' },
  { mistake: 'Неподача сигналов поворота', penalty: '2 штрафных балла' },
  { mistake: 'Резкое торможение без необходимости', penalty: '2 штрафных балла' },
  { mistake: 'Остановка двигателя на месте старта или во время маневрирования', penalty: '1 штрафной балл' },
  { mistake: 'Превышение допустимой скорости движения', penalty: '1 штрафной балл' },
];

const UPSELL_SCRIPTS = [
  { situation: 'Ученик неуверенно паркуется / чувствует нехватку практики', script: '«Смотрю, тебе нужно ещё немного времени на отработку — базового пакета часто не хватает именно на манёвры. Могу предложить блок из 3–5 дополнительных занятий, чтобы ты подъехал на экзамен уверенным на 100%.»' },
  { situation: 'Ученик готовится к экзамену, но нервничает', script: '«Экзаменационный маршрут лучше проехать пару раз именно с той машиной, на которой будешь сдавать — предлагаю добавить 2 занятия по маршруту перед экзаменом.»' },
  { situation: 'Ученик закончил базовый курс, но результаты нестабильны', script: '«Твой прогресс хороший, но пара тем ещё требуют внимания. Рекомендую взять индивидуальный урок по этим темам — это сильно повысит шансы сдать с первого раза.»' },
];

function DefensiveDrivingCard() {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-600/15 flex items-center justify-center">
          <Icon name="ShieldCheck" size={19} className="text-rose-500" />
        </div>
        <div>
          <h3 className="text-white font-montserrat font-bold text-base">5 правил защитного вождения Гарольда Смита</h3>
          <p className="text-slate-500 text-xs">Основа системы обучения автошколы «ВЕКТОР»</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {DEFENSIVE_RULES.map((r, i) => (
          <div key={i} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
            <div className="flex items-center gap-2.5 mb-2">
              <Icon name={r.icon} size={16} className="text-rose-500 flex-shrink-0" />
              <p className="text-white font-semibold text-sm">{r.title}</p>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCard() {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Icon name="HeartHandshake" size={19} className="text-emerald-500" />
        </div>
        <h3 className="text-white font-montserrat font-bold text-base">Регламент сервиса и бесконфликтного общения</h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {SERVICE_RULES.map((rule, i) => (
          <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
            <Icon name="CheckCircle2" size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamChecklistCard() {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Icon name="ListChecks" size={19} className="text-amber-500" />
        </div>
        <h3 className="text-white font-montserrat font-bold text-base">Чек-лист штрафных баллов ГИБДД</h3>
      </div>
      <div className="flex flex-col divide-y divide-slate-700/60">
        {EXAM_CHECKLIST.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-slate-300 text-sm">{item.mistake}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
              item.penalty === 'Снятие с экзамена' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
            }`}>
              {item.penalty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpsellCard() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
          <Icon name="TrendingUp" size={19} className="text-cyan-500" />
        </div>
        <h3 className="text-white font-montserrat font-bold text-base">Скрипты расширения учебных пакетов</h3>
      </div>
      <div className="flex flex-col gap-2">
        {UPSELL_SCRIPTS.map((s, i) => (
          <div key={i} className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-white text-sm font-semibold">{s.situation}</span>
              <Icon name={open === i ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-500 flex-shrink-0" />
            </button>
            {open === i && (
              <div className="px-4 pb-3 text-slate-400 text-sm leading-relaxed italic">{s.script}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnowledgeBaseTab() {
  return (
    <div className="flex flex-col gap-5">
      <DefensiveDrivingCard />
      <ServiceCard />
      <ExamChecklistCard />
      <UpsellCard />
    </div>
  );
}