import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getBranches, Branch } from '@/api/branches';
import {
  getInstructors, addInstructor, updateInstructor, removeInstructor,
  getKpiTable, saveKpiRow, InstructorRow, KpiTableRow,
} from '@/api/instructorsAdmin';

function generateDigitPassword(length = 6): string {
  let pw = '';
  for (let i = 0; i < length; i++) pw += Math.floor(Math.random() * 10);
  return pw;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function fmtPeriodLabel(period: string): string {
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const d = new Date(period);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Форма добавления инструктора ─────────────────────────────────────────────
function AddInstructorModal({ branches, onClose, onAdded }: { branches: Branch[]; onClose: () => void; onAdded: (i: InstructorRow) => void }) {
  const [form, setForm] = useState({ name: '', login: '', password: '', branch_id: branches[0]?.id ?? '', car_model: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await addInstructor({ ...form, branch_id: form.branch_id ? Number(form.branch_id) : null });
      onAdded(data.instructor);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Добавить инструктора</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">ФИО</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Смирнов Алексей Викторович"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Логин</label>
            <input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required placeholder="smirnov"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Пароль</label>
            <div className="flex gap-2">
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Минимум 4 символа"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] font-mono" />
              <button type="button" onClick={() => setForm(f => ({ ...f, password: generateDigitPassword() }))}
                title="Сгенерировать пароль"
                className="px-3.5 rounded-xl border border-gray-200 text-gray-500 hover:border-[#E8002D] hover:text-[#E8002D] transition-colors flex-shrink-0">
                <Icon name="Dices" size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Филиал</label>
            <select value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] bg-white">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Учебный автомобиль</label>
            <input value={form.car_model} onChange={e => setForm(f => ({ ...f, car_model: e.target.value }))} placeholder="Lada Vesta (АУ 777 45)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm"><Icon name="AlertCircle" size={13} />{error}</div>}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Редактируемая ячейка числа ────────────────────────────────────────────────
function NumCell({ value, onChange, min = 0, max = 999, width = 'w-14' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; width?: string }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
      className={`${width} px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center outline-none focus:border-[#E8002D] focus:bg-white bg-gray-50`}
    />
  );
}

// ── Сама таблица (переиспользуется в обычном и полноэкранном режиме) ──────────
interface KpiTableProps {
  rows: KpiTableRow[];
  instructors: InstructorRow[];
  savingIds: Set<number>;
  updateField: (id: number, field: keyof KpiTableRow, value: string | number) => void;
  onRemove: (i: InstructorRow) => void;
}

function KpiTable({ rows, instructors, savingIds, updateField, onRemove }: KpiTableProps) {
  return (
    <table className="w-full text-sm border-collapse min-w-[1100px]">
      <thead>
        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-gray-50 z-10">Мастер</th>
          <th className="px-3 py-3 text-left font-semibold">Филиал</th>
          <th className="px-2 py-3 font-semibold" title="Отзывы (макс 15 баллов)">Отзывы</th>
          <th className="px-2 py-3 font-semibold" title="Экзамены (макс 15 баллов)">Экзамены</th>
          <th className="px-2 py-3 font-semibold" title="Сдали">Сдали</th>
          <th className="px-2 py-3 font-semibold" title="% сдачи (макс 25 баллов)">% сдачи</th>
          <th className="px-2 py-3 font-semibold" title="Повышения пакета (макс 10 баллов)">Повышения</th>
          <th className="px-2 py-3 font-semibold" title="ПДД (макс 20 баллов)">ПДД</th>
          <th className="px-2 py-3 font-semibold" title="Дисциплина 0-10">Дисц.</th>
          <th className="px-2 py-3 font-semibold" title="Сервис 0-5">Серв.</th>
          <th className="px-3 py-3 font-semibold text-[#E8002D]">Итого /100</th>
          <th className="px-2 py-3 font-semibold">Место</th>
          <th className="px-3 py-3 text-left font-semibold">Примечание</th>
          <th className="px-2 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const instr = instructors.find(i => i.id === r.instructor_id);
          const isSaving = savingIds.has(r.instructor_id);
          return (
            <tr key={r.instructor_id} className="border-t border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2 sticky left-0 bg-white z-10 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {r.rank === 1 && <Icon name="Trophy" size={13} className="text-amber-400 flex-shrink-0" />}
                  <span className="font-medium text-[#1a1a1a]">{r.name}</span>
                  {isSaving && <Icon name="Loader" size={11} className="animate-spin text-gray-300 flex-shrink-0" />}
                </div>
              </td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{r.branch_name || '—'}</td>
              <td className="px-2 py-2">
                <NumCell value={r.reviews} onChange={v => updateField(r.instructor_id, 'reviews', v)} />
                <div className="text-[10px] text-center text-gray-400 mt-0.5">{r.reviews_points} б.</div>
              </td>
              <td className="px-2 py-2">
                <NumCell value={r.exams} onChange={v => updateField(r.instructor_id, 'exams', v)} />
                <div className="text-[10px] text-center text-gray-400 mt-0.5">{r.exams_points} б.</div>
              </td>
              <td className="px-2 py-2">
                <NumCell value={r.passed} onChange={v => updateField(r.instructor_id, 'passed', v)} />
              </td>
              <td className="px-2 py-2 text-center">
                <span className="text-sm font-semibold text-gray-700">{r.pass_percent}%</span>
                <div className="text-[10px] text-center text-gray-400 mt-0.5">{r.pass_points} б.</div>
              </td>
              <td className="px-2 py-2">
                <NumCell value={r.package_upgrades_n} onChange={v => updateField(r.instructor_id, 'package_upgrades_n', v)} max={20} />
                <div className="text-[10px] text-center text-gray-400 mt-0.5">{r.upgrades_points} б.</div>
              </td>
              <td className="px-2 py-2">
                <select
                  value={r.pdd_status}
                  onChange={e => updateField(r.instructor_id, 'pdd_status', e.target.value)}
                  className={`w-20 px-1.5 py-1.5 rounded-lg border text-xs text-center outline-none ${
                    r.pdd_status === 'Сдал' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <option value="">—</option>
                  <option value="Сдал">Сдал</option>
                  <option value="Не сдал">Не сдал</option>
                </select>
              </td>
              <td className="px-2 py-2">
                <NumCell value={r.discipline} onChange={v => updateField(r.instructor_id, 'discipline', v)} max={10} width="w-12" />
              </td>
              <td className="px-2 py-2">
                <NumCell value={r.service} onChange={v => updateField(r.instructor_id, 'service', v)} max={5} width="w-12" />
              </td>
              <td className="px-3 py-2 text-center">
                <span className="font-montserrat font-bold text-base text-[#1a1a1a]">{r.total_score}</span>
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  r.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>{r.rank}</span>
              </td>
              <td className="px-3 py-2">
                <input
                  value={r.note}
                  onChange={e => updateField(r.instructor_id, 'note', e.target.value)}
                  placeholder="—"
                  className="w-32 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#E8002D] bg-gray-50 focus:bg-white"
                />
              </td>
              <td className="px-2 py-2">
                {instr && (
                  <button onClick={() => onRemove(instr)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Основной компонент: общая таблица KPI ──────────────────────────────────────
export default function InstructorsEditor() {
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<KpiTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<InstructorRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const period = currentPeriod();
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([getInstructors(), getBranches(), getKpiTable(period)])
      .then(([i, b, k]) => { setInstructors(i.instructors); setBranches(b.branches); setRows(k.rows); })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const recompute = (r: KpiTableRow): KpiTableRow => {
    const scaleReviewsExams = (n: number) => n >= 10 ? 15 : n >= 8 ? 13 : n >= 6 ? 11 : n >= 4 ? 8 : n >= 2 ? 5 : n === 1 ? 2 : 0;
    const scaleUpgrades = (n: number) => n >= 5 ? 10 : n === 4 ? 9 : n === 3 ? 7 : n === 2 ? 5 : n === 1 ? 3 : 0;
    const reviews_points = scaleReviewsExams(r.reviews);
    const exams_points = scaleReviewsExams(r.exams);
    let pass_percent = 0, pass_points = 0;
    if (r.exams > 0) {
      const pct = r.passed / r.exams;
      pass_percent = Math.round(pct * 100);
      pass_points = pct >= 0.9 ? 25 : pct >= 0.8 ? 22 : pct >= 0.7 ? 19 : pct >= 0.6 ? 16 : pct >= 0.5 ? 12 : pct >= 0.4 ? 8 : 4;
    }
    const upgrades_points = scaleUpgrades(r.package_upgrades_n);
    const pdd_points = r.pdd_status === 'Сдал' ? 20 : 0;
    const total_score = reviews_points + exams_points + pass_points + upgrades_points + pdd_points + r.discipline + r.service;
    return { ...r, reviews_points, exams_points, pass_percent, pass_points, upgrades_points, pdd_points, total_score };
  };

  const rerank = (list: KpiTableRow[]): KpiTableRow[] => {
    const sorted = [...list].sort((a, b) => b.total_score - a.total_score);
    const rankMap = new Map(sorted.map((r, idx) => [r.instructor_id, idx + 1]));
    return list.map(r => ({ ...r, rank: rankMap.get(r.instructor_id) || 0 }));
  };

  const scheduleSave = (instructor_id: number, updated: KpiTableRow) => {
    setSavingIds(prev => new Set(prev).add(instructor_id));
    if (saveTimers.current[instructor_id]) clearTimeout(saveTimers.current[instructor_id]);
    saveTimers.current[instructor_id] = setTimeout(async () => {
      try {
        await saveKpiRow({
          instructor_id, period,
          reviews: updated.reviews, exams: updated.exams, passed: updated.passed,
          package_upgrades_n: updated.package_upgrades_n, pdd_status: updated.pdd_status,
          discipline: updated.discipline, service: updated.service, note: updated.note,
        });
      } finally {
        setSavingIds(prev => { const next = new Set(prev); next.delete(instructor_id); return next; });
      }
    }, 700);
  };

  const updateField = (instructor_id: number, field: keyof KpiTableRow, value: string | number) => {
    setRows(prev => {
      const next = prev.map(r => r.instructor_id === instructor_id ? recompute({ ...r, [field]: value } as KpiTableRow) : r);
      const reranked = rerank(next);
      const target = reranked.find(r => r.instructor_id === instructor_id);
      if (target) scheduleSave(instructor_id, target);
      return reranked;
    });
  };

  const toggleActive = async (i: InstructorRow) => {
    await updateInstructor({ id: i.id, is_active: !i.is_active });
    setInstructors(prev => prev.map(x => x.id === i.id ? { ...x, is_active: !x.is_active } : x));
    if (i.is_active) setRows(prev => prev.filter(r => r.instructor_id !== i.id));
    else loadAll();
  };

  if (loading) return (
    <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Мотивация мастеров</h2>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{fmtPeriodLabel(period)} · баллы считаются автоматически по шкале</p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button onClick={() => setFullscreen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-[#1a1a1a] transition-colors">
              <Icon name="Maximize2" size={15} />На весь экран
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: '#E8002D' }}>
            <Icon name="UserPlus" size={15} />Добавить мастера
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Users" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Инструкторов пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <KpiTable rows={rows} instructors={instructors} savingIds={savingIds} updateField={updateField} onRemove={setRemoveTarget} />
        </div>
      )}

      {instructors.some(i => !i.is_active) && (
        <details className="text-sm text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">Заблокированные инструкторы ({instructors.filter(i => !i.is_active).length})</summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {instructors.filter(i => !i.is_active).map(i => (
              <div key={i.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                <span>{i.name} · @{i.login}</span>
                <button onClick={() => toggleActive(i)} className="text-xs font-semibold text-green-600 hover:underline">Восстановить</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {showAdd && (
        <AddInstructorModal
          branches={branches}
          onClose={() => setShowAdd(false)}
          onAdded={() => loadAll()}
        />
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon name="Trash2" size={18} className="text-red-500" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2">Удалить инструктора?</h3>
            <p className="text-sm text-gray-500 mb-5">«{removeTarget.name}» будет деактивирован и исчезнет из таблицы. Данные сохранятся, его можно восстановить.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRemoveTarget(null)} disabled={removing}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60">Отмена</button>
              <button
                type="button"
                disabled={removing}
                onClick={async () => {
                  setRemoving(true);
                  try {
                    await removeInstructor(removeTarget.id);
                    setInstructors(prev => prev.map(x => x.id === removeTarget.id ? { ...x, is_active: false } : x));
                    setRows(prev => prev.filter(r => r.instructor_id !== removeTarget.id));
                    setRemoveTarget(null);
                  } finally { setRemoving(false); }
                }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 bg-red-500"
              >
                {removing ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Мотивация мастеров</h2>
              <p className="text-sm text-gray-400 mt-0.5 capitalize">{fmtPeriodLabel(period)}</p>
            </div>
            <button onClick={() => setFullscreen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-[#1a1a1a] transition-colors">
              <Icon name="Minimize2" size={15} />Свернуть
            </button>
          </div>
          <div className="flex-1 overflow-auto px-6 py-4">
            <KpiTable rows={rows} instructors={instructors} savingIds={savingIds} updateField={updateField} onRemove={setRemoveTarget} />
          </div>
        </div>
      )}
    </div>
  );
}