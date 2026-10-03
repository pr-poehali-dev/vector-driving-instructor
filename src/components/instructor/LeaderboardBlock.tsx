import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getLeaderboard, Leaderboard } from '@/api/instructor';

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

function fmt(period: string): string {
  const d = new Date(period);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const MEDAL: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' };

function prevMonth(): string {
  const d = new Date();
  const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function LeaderboardBlock() {
  const [period, setPeriod] = useState<string>(prevMonth());
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [period]);

  const periods = data?.periods || [];
  const idx = periods.indexOf(period);
  const hasRows = !!data && data.rows.some(r => r.total_score > 0);
  const top3 = data?.rows.slice(0, 3) || [];
  const cup = data?.branch_ranking[0];

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Icon name="Medal" size={18} className="text-amber-400" />
          <h3 className="text-white font-montserrat font-bold text-base">Итоги месяца</h3>
        </div>
        <div className="flex items-center rounded-xl border border-slate-700 overflow-hidden">
          <button onClick={() => idx >= 0 && idx < periods.length - 1 && setPeriod(periods[idx + 1])}
            disabled={idx < 0 || idx >= periods.length - 1}
            className="px-2.5 py-2 text-slate-400 hover:bg-slate-700/50 disabled:opacity-30">
            <Icon name="ChevronLeft" size={15} />
          </button>
          <span className="px-3 text-xs font-semibold text-white capitalize min-w-[120px] text-center">{fmt(period)}</span>
          <button onClick={() => idx > 0 && setPeriod(periods[idx - 1])}
            disabled={idx <= 0}
            className="px-2.5 py-2 text-slate-400 hover:bg-slate-700/50 disabled:opacity-30">
            <Icon name="ChevronRight" size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500"><Icon name="Loader" size={20} className="animate-spin mx-auto" /></div>
      ) : !data || !hasRows ? (
        <p className="py-6 text-center text-slate-500 text-sm">За этот месяц итогов пока нет</p>
      ) : (
        <>
          <button onClick={() => setOpen(o => !o)} className="w-full text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map(r => (
                <div key={r.instructor_id}
                  className={`rounded-xl border p-4 flex items-center gap-3 ${r.is_me ? 'bg-rose-600/10 border-rose-600/40' : 'bg-slate-900/50 border-slate-700/60'}`}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center font-montserrat font-black flex-shrink-0"
                    style={{ background: `${MEDAL[r.rank]}22`, color: MEDAL[r.rank] }}>{r.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{r.name}</p>
                    <p className="text-slate-500 text-xs truncate">{r.branch_name || '—'}</p>
                  </div>
                  <span className="text-white font-montserrat font-bold">{r.total_score}</span>
                </div>
              ))}
            </div>
            {cup && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 flex items-center gap-3">
                <Icon name="Trophy" size={20} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs">Кубок филиала</p>
                  <p className="text-white text-sm font-semibold truncate">{cup.branch_name}</p>
                </div>
                <span className="text-white font-montserrat font-bold">{cup.final_score}</span>
              </div>
            )}
            <p className="text-slate-500 text-xs mt-3 flex items-center gap-1">
              <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={13} />
              {open ? 'Скрыть полную статистику' : 'Нажмите, чтобы посмотреть полную статистику'}
            </p>
          </button>

          {open && data && (
            <div className="mt-4 flex flex-col gap-5">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Рейтинг мастеров</p>
                <div className="rounded-xl border border-slate-700/60 overflow-hidden">
                  {data.rows.map(r => (
                    <div key={r.instructor_id}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/60 last:border-b-0 ${r.is_me ? 'bg-rose-600/10' : ''}`}>
                      <span className="w-6 text-center text-xs font-bold text-slate-400">{r.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{r.name}{r.is_me && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600">Вы</span>}</p>
                        <p className="text-slate-500 text-xs truncate">{r.branch_name || '—'}</p>
                      </div>
                      <span className="text-white font-montserrat font-bold text-sm">{r.total_score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Кубок филиала</p>
                <div className="flex flex-col gap-2">
                  {data.branch_ranking.map(b => (
                    <div key={b.branch_id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${b.branch_id === data.my_branch_id ? 'bg-rose-600/10 border-rose-600/40' : 'bg-slate-900/50 border-slate-700/60'}`}>
                      <span className="w-6 text-center text-xs font-bold text-slate-400">{b.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{b.branch_name}</p>
                        <p className="text-slate-500 text-xs">{b.masters_count} мастеров · % сдачи {b.pass_percent}% · ПДД сдали {b.pdd_share}%</p>
                      </div>
                      <span className="text-white font-montserrat font-bold">{b.final_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
