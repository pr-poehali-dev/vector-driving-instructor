import Icon from '@/components/ui/icon';
import VectorLogo from '@/components/VectorLogo';
import { KpiTableRow, BranchRanking } from '@/api/instructorsAdmin';

const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

function fmtPeriodLabel(period: string): string {
  const d = new Date(period);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

const MEDAL_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#94a3b8',
  3: '#b45309',
};

function PodiumCard({ row }: { row: KpiTableRow }) {
  const color = MEDAL_COLORS[row.rank] || '#64748b';
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col items-center text-center gap-2 relative overflow-hidden">
      {row.rank === 1 && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 to-transparent pointer-events-none" />
      )}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-montserrat font-black text-lg relative z-10"
        style={{ background: `${color}22`, color }}
      >
        {row.rank}
      </div>
      {row.rank === 1 && <Icon name="Trophy" size={18} className="text-amber-400 relative z-10" />}
      <p className="text-white font-montserrat font-bold text-sm relative z-10 leading-tight">{row.name}</p>
      <p className="text-slate-500 text-xs relative z-10">{row.branch_name || '—'}</p>
      <div className="flex items-baseline gap-1 relative z-10 mt-1">
        <span className="text-2xl font-montserrat font-black text-white">{row.total_score}</span>
        <span className="text-slate-500 text-xs">/ 100</span>
      </div>
    </div>
  );
}

function BranchCupBlock({ ranking }: { ranking: BranchRanking[] }) {
  if (ranking.length === 0) return null;
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon name="Building2" size={18} className="text-cyan-400" />
        <h3 className="text-white font-montserrat font-bold text-base">Кубок филиала</h3>
        <span className="text-slate-500 text-xs ml-1">командный рейтинг</span>
      </div>
      <div className="flex flex-col gap-2">
        {ranking.map(b => {
          const isWinner = b.final_score >= 70;
          return (
            <div
              key={b.branch_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                b.rank === 1 ? 'bg-amber-400/5 border-amber-400/30' : 'bg-slate-900/50 border-slate-700/60'
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                b.rank === 1 ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {b.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold truncate">{b.branch_name}</p>
                  {isWinner && <Icon name="Trophy" size={12} className="text-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{b.masters_count} мастеров · % сдачи {b.pass_percent}% · ПДД сдали {b.pdd_share}%</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-montserrat font-bold text-lg leading-none">{b.final_score}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">/ 100</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-slate-500 text-xs mt-4">Условие победы: итог филиала ≥ 70 баллов. Приз — командное мероприятие до 20 000 ₽.</p>
    </div>
  );
}

export default function InstructorsLeaderboardModal({
  rows, branchRanking, period, onClose,
}: {
  rows: KpiTableRow[];
  branchRanking: BranchRanking[];
  period: string;
  onClose: () => void;
}) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto font-opensans">
      <header className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <VectorLogo size="sm" inverted />
            <div className="hidden sm:block w-px h-8 bg-slate-700" />
            <div className="hidden sm:block">
              <p className="text-white text-sm font-semibold">Рейтинг мастеров</p>
              <p className="text-slate-500 text-xs capitalize">{fmtPeriodLabel(period)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0">
            <Icon name="X" size={15} />Закрыть
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        {rows.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            <Icon name="Users" size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Инструкторов пока нет</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {top3.map(r => <PodiumCard key={r.instructor_id} row={r} />)}
              </div>
            )}

            {rest.length > 0 && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700">
                  <h3 className="text-white font-montserrat font-bold text-base">Полный рейтинг</h3>
                </div>
                <div className="flex flex-col">
                  {rest.map(r => (
                    <div key={r.instructor_id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/60 last:border-b-0">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-slate-400 text-xs font-bold flex-shrink-0">
                        {r.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.name}</p>
                        <p className="text-slate-500 text-xs truncate">{r.branch_name || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-montserrat font-bold text-base text-white">{r.total_score}</span>
                        <span className="text-slate-500 text-xs"> / 100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <BranchCupBlock ranking={branchRanking} />
      </div>
    </div>
  );
}
