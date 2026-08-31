import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getBranches, Branch } from '@/api/branches';
import {
  getInstructors, addInstructor, updateInstructor, removeInstructor,
  getInstructorKpi, saveInstructorKpi, InstructorRow, InstructorKpiRow,
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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
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

// ── Модалка KPI ───────────────────────────────────────────────────────────────
const KPI_FIELDS: { key: keyof InstructorKpiRow; label: string; max: number; type: 'bool' | 'number' }[] = [
  { key: 'pdd_test_points', label: 'Баллы за зачёт ПДД', max: 20, type: 'number' },
  { key: 'practical_pass_percent', label: 'Процент сдачи практики (%)', max: 100, type: 'number' },
  { key: 'practical_passed', label: 'Сдали практику (чел.)', max: 999, type: 'number' },
  { key: 'practical_total', label: 'Всего сдавало (чел.)', max: 999, type: 'number' },
  { key: 'practical_points', label: 'Баллы за практику', max: 25, type: 'number' },
  { key: 'students_at_exam', label: 'Курсантов на экзамене', max: 999, type: 'number' },
  { key: 'students_at_exam_points', label: 'Баллы за курсантов', max: 15, type: 'number' },
  { key: 'reviews_count', label: 'Отзывов курсантов', max: 999, type: 'number' },
  { key: 'reviews_points', label: 'Баллы за отзывы', max: 15, type: 'number' },
  { key: 'package_upgrades', label: 'Повышений пакета', max: 999, type: 'number' },
  { key: 'package_upgrades_points', label: 'Баллы за повышения', max: 10, type: 'number' },
  { key: 'discipline_points', label: 'Дисциплина', max: 10, type: 'number' },
  { key: 'service_points', label: 'Сервис', max: 5, type: 'number' },
  { key: 'rank_in_branch', label: 'Место в филиале', max: 999, type: 'number' },
  { key: 'bonus_amount', label: 'Сумма премии (₽)', max: 999999, type: 'number' },
];

function KpiModal({ instructor, onClose }: { instructor: InstructorRow; onClose: () => void }) {
  const [form, setForm] = useState<Partial<InstructorKpiRow>>({});
  const [pddPassed, setPddPassed] = useState(false);
  const [bonusLabel, setBonusLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const period = currentPeriod();

  useEffect(() => {
    getInstructorKpi(instructor.id, period)
      .then(d => {
        if (d.kpi) {
          setForm(d.kpi);
          setPddPassed(d.kpi.pdd_test_passed);
          setBonusLabel(d.kpi.bonus_label || '');
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructor.id]);

  const setField = (key: keyof InstructorKpiRow, val: string) => {
    setForm(f => ({ ...f, [key]: val === '' ? 0 : Number(val) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await saveInstructorKpi({ ...form, instructor_id: instructor.id, period, pdd_test_passed: pddPassed, bonus_label: bonusLabel });
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a]">KPI: {instructor.name}</h3>
            <p className="text-xs text-gray-400">Показатели за текущий месяц</p>
          </div>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        {loading ? (
          <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div>
        ) : saved ? (
          <div className="py-16 text-center text-green-600"><Icon name="CheckCircle2" size={28} className="mx-auto mb-2" />Сохранено</div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <div className={`w-10 h-6 rounded-full relative transition-colors ${pddPassed ? 'bg-green-500' : 'bg-gray-300'}`}
                onClick={() => setPddPassed(v => !v)}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${pddPassed ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-700">Зачёт ПДД сдан</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {KPI_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                  <input
                    type="number"
                    value={(form[f.key] as number) ?? 0}
                    onChange={e => setField(f.key, e.target.value)}
                    max={f.max}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Название премии</label>
                <input value={bonusLabel} onChange={e => setBonusLabel(e.target.value)} placeholder="Мастер месяца"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
              </div>
            </div>

            {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm"><Icon name="AlertCircle" size={13} />{error}</div>}
            <div className="flex gap-3 mt-2 sticky bottom-0 bg-white pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ background: '#E8002D' }}>
                {saving ? 'Сохранение...' : 'Сохранить KPI'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function InstructorsEditor() {
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [kpiTarget, setKpiTarget] = useState<InstructorRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<InstructorRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    Promise.all([getInstructors(), getBranches()])
      .then(([i, b]) => { setInstructors(i.instructors); setBranches(b.branches); })
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (i: InstructorRow) => {
    await updateInstructor({ id: i.id, is_active: !i.is_active });
    setInstructors(prev => prev.map(x => x.id === i.id ? { ...x, is_active: !x.is_active } : x));
  };

  if (loading) return (
    <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Инструкторы</h2>
          <p className="text-sm text-gray-400 mt-0.5">Мастера производственного обучения и их показатели KPI</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: '#E8002D' }}>
          <Icon name="UserPlus" size={15} />Добавить
        </button>
      </div>

      {instructors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Users" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Инструкторов пока нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {instructors.map(i => (
            <div key={i.id} className="flex items-center gap-3 px-5 py-3.5 flex-wrap">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i.is_active ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i.name[0]}
              </div>
              <div className="flex-1 min-w-[160px]">
                <p className={`text-sm font-medium ${i.is_active ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{i.name}</p>
                <p className="text-xs text-gray-400">@{i.login} · {i.branch_name || 'без филиала'} · {i.car_model || '—'}</p>
              </div>
              <span className="hidden sm:inline text-xs text-gray-400">Вход: {fmtDate(i.last_seen)}</span>
              <button onClick={() => setKpiTarget(i)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                <Icon name="BarChart2" size={12} />KPI
              </button>
              <button onClick={() => setRemoveTarget(i)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
              <button onClick={() => toggleActive(i)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${i.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                {i.is_active ? 'Активен' : 'Заблокирован'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddInstructorModal
          branches={branches}
          onClose={() => setShowAdd(false)}
          onAdded={i => setInstructors(prev => [i, ...prev])}
        />
      )}

      {kpiTarget && <KpiModal instructor={kpiTarget} onClose={() => setKpiTarget(null)} />}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon name="Trash2" size={18} className="text-red-500" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2">Удалить инструктора?</h3>
            <p className="text-sm text-gray-500 mb-5">Инструктор «{removeTarget.name}» будет деактивирован.</p>
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
    </div>
  );
}
