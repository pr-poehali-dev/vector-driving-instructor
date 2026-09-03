import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getKpi, KpiData } from '@/api/instructor';

const MONTH_NAMES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function fmtPeriod(period: string): string {
  const d = new Date(period);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

interface KpiCardProps {
  icon: string;
  iconColor: string;
  title: string;
  fact: string;
  points: string;
  sub?: string;
}

function KpiCard({ icon, iconColor, title, fact, points, sub }: KpiCardProps) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}22` }}>
          <Icon name={icon} size={19} style={{ color: iconColor }} />
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{points}</span>
      </div>
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">{title}</p>
        <p className="text-white font-montserrat font-bold text-lg leading-tight">{fact}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function KpiTab() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKpi()
      .then(d => setData(d.kpi))
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Icon name="Loader" size={26} className="animate-spin mx-auto mb-3" />
        Загрузка показателей...
      </div>
    );
  }

  if (error) {
    return <div className="py-24 text-center text-slate-500 text-sm">{error}</div>;
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Icon name="ClipboardX" size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Показатели за этот месяц пока не внесены администрацией</p>
      </div>
    );
  }

  const isLeader = data.rank === 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Баннер */}
      <div className="rounded-3xl overflow-hidden relative bg-gradient-to-br from-slate-800 via-slate-800 to-rose-950/40 border border-slate-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Итоговый балл за {fmtPeriod(data.period)}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-montserrat font-black text-5xl text-white">{data.total_score}</span>
              <span className="text-slate-500 text-xl font-semibold">/ 100</span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {data.rank && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700">
                <Icon name="Trophy" size={20} className={isLeader ? 'text-amber-400' : 'text-slate-500'} />
                <div>
                  <p className="text-white font-bold text-sm leading-none">{data.rank} место</p>
                  <p className="text-slate-500 text-xs mt-0.5">из {data.rank_total} мастеров</p>
                </div>
              </div>
            )}
            {isLeader && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-600/15 border border-rose-600/30">
                <Icon name="Award" size={20} className="text-rose-500" />
                <div>
                  <p className="text-white font-bold text-sm leading-none">Мастер месяца</p>
                  <p className="text-rose-400 text-xs mt-0.5 font-semibold">5 000 ₽</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon="MessageSquareHeart" iconColor="#f59e0b"
          title="Отзывы курсантов"
          fact={`${data.reviews} отзывов`}
          points={`${data.reviews_points} / 15`}
        />
        <KpiCard
          icon="GraduationCap" iconColor="#8b5cf6"
          title="Курсанты на экзамене"
          fact={`${data.exams} человек`}
          points={`${data.exams_points} / 15`}
        />
        <KpiCard
          icon="TrendingUp" iconColor="#f43f5e"
          title="Процент сдачи"
          fact={`${data.pass_percent}%`}
          points={`${data.pass_points} / 25`}
          sub={`${data.passed} из ${data.exams} сдали`}
        />
        <KpiCard
          icon="Package" iconColor="#06b6d4"
          title="Повышения пакета"
          fact={`${data.package_upgrades_n} повышения`}
          points={`${data.upgrades_points} / 10`}
        />
        <KpiCard
          icon="CheckCircle2" iconColor="#10b981"
          title="Зачёт ПДД"
          fact={data.pdd_status === 'Сдал' ? 'Сдано' : data.pdd_status === 'Не сдал' ? 'Не сдано' : 'Ещё не пройден'}
          points={`${data.pdd_points} / 20`}
        />
        <KpiCard
          icon="ShieldCheck" iconColor="#22c55e"
          title="Дисциплина и сервис"
          fact="Оценка руководства"
          points={`${data.discipline + data.service} / 15`}
          sub={`${data.discipline}/10 дисциплина, ${data.service}/5 сервис`}
        />
      </div>

      {data.note && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Icon name="MessageSquare" size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Примечание от руководства</p>
            <p className="text-slate-300 text-sm">{data.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
