import { useState, useEffect } from 'react';
import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';
import ContentEditor from '@/components/admin/ContentEditor';
import AiSettings from '@/components/admin/AiSettings';
import AiTraining from '@/components/admin/AiTraining';
import SupportTickets from '@/components/admin/SupportTickets';
import PddManager from '@/components/admin/PddManager';
import ChatLogs from '@/components/admin/ChatLogs';
import { managerLogin, managerMe, managerLogout, ManagerSession } from '@/api/managers';
import { getStudents, addStudent, updateStudent, removeStudent } from '@/api/auth';

interface Student {
  id: number; name: string; login: string; is_active: boolean; notes: string; created_at: string;
  last_seen?: string | null; access_until?: string | null; plain_password?: string | null;
}

function generateDigitPassword(length = 6): string {
  let pw = '';
  for (let i = 0; i < length; i++) pw += Math.floor(Math.random() * 10);
  return pw;
}

// Пресеты срока доступа для быстрого выбора
const ACCESS_PRESETS: { label: string; hours: number | null }[] = [
  { label: '1 час', hours: 1 },
  { label: '2 часа', hours: 2 },
  { label: '3 часа', hours: 3 },
  { label: 'Сутки', hours: 24 },
  { label: 'Неделя', hours: 24 * 7 },
  { label: 'Месяц', hours: 24 * 30 },
  { label: 'Без ограничения', hours: null },
];

function fmtAccessUntil(iso: string | null | undefined): string {
  if (!iso) return 'Бессрочно';
  const d = new Date(iso);
  const expired = d.getTime() <= Date.now();
  const str = d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  return expired ? `Истёк ${str}` : `До ${str}`;
}

function AccessUntilPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const activePreset = ACCESS_PRESETS.find(p => {
    if (p.hours === null) return value === null;
    if (!value) return false;
    const diffH = (new Date(value).getTime() - Date.now()) / 3600000;
    return Math.abs(diffH - p.hours) < 0.05;
  });

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Срок действия доступа</label>
      <div className="flex flex-wrap gap-1.5">
        {ACCESS_PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.hours === null ? null : new Date(Date.now() + p.hours * 3600000).toISOString())}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activePreset?.label === p.label
                ? 'bg-[#E8002D] text-white border-[#E8002D]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#E8002D]/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-400 mt-1.5">
          Доступ будет автоматически заблокирован {new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}

// ── Вход ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onSuccess }: { onSuccess: (s: ManagerSession) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await managerLogin(login.trim(), password);
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] px-4 font-opensans">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: '#1a1a1a' }}>
          <div className="flex justify-center mb-4"><VectorLogo size="md" inverted /></div>
          <p className="text-white/50 text-sm mt-2">Кабинет менеджера</p>
        </div>
        <form onSubmit={submit} className="px-8 py-7 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Логин</label>
            <input value={login} onChange={e => setLogin(e.target.value)} required placeholder="ivanov"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Пароль</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Пароль"
                className="w-full pr-10 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon name={showPw ? 'EyeOff' : 'Eye'} size={15} />
              </button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm"><Icon name="AlertCircle" size={14} />{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-montserrat font-bold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: '#E8002D' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          <p className="text-center text-xs text-gray-400">
            Администратор? <a href="/admin" className="text-[#E8002D] hover:underline">Войти в админ-кабинет</a>
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Редактирование ученика (полная карточка) ──────────────────────────────────
function EditStudentModal({ student, onClose, onUpdated }: { student: Student; onClose: () => void; onUpdated: (s: Student) => void }) {
  const [form, setForm] = useState({ name: student.name, notes: student.notes || '', is_active: student.is_active, password: '' });
  const [accessUntil, setAccessUntil] = useState<string | null>(student.access_until ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload: Parameters<typeof updateStudent>[0] = { id: student.id, name: form.name, notes: form.notes, is_active: form.is_active, access_until: accessUntil };
      if (form.password) payload.password = form.password;
      const data = await updateStudent(payload);
      onUpdated(data.student);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-montserrat font-bold text-lg">Редактировать ученика</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Имя</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>
          {student.plain_password && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <Icon name="KeyRound" size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">Текущий пароль:</span>
              <span className="text-sm font-mono font-semibold text-[#1a1a1a] select-all">{student.plain_password}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Новый пароль (если нужно сменить)</label>
            <div className="flex gap-2">
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Оставьте пустым, чтобы не менять"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] font-mono" />
              <button type="button" onClick={() => setForm(f => ({ ...f, password: generateDigitPassword() }))}
                title="Сгенерировать цифровой пароль"
                className="px-3.5 rounded-xl border border-gray-200 text-gray-500 hover:border-[#E8002D] hover:text-[#E8002D] transition-colors flex-shrink-0">
                <Icon name="Dices" size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Заметка</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`w-10 h-6 rounded-full relative transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">{form.is_active ? 'Доступ активен' : 'Доступ заблокирован'}</span>
          </label>
          <AccessUntilPicker value={accessUntil} onChange={setAccessUntil} />
          {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: '#E8002D' }}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Таблица учеников (упрощённая) ─────────────────────────────────────────────
function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', login: '', password: '', notes: '' });
  const [addAccessUntil, setAddAccessUntil] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getStudents().then(d => { setStudents(d.students || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.login.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(''); setAddLoading(true);
    try {
      const data = await addStudent({ ...addForm, access_until: addAccessUntil });
      setStudents(prev => [data.student, ...prev]);
      setShowAdd(false); setAddForm({ name: '', login: '', password: '', notes: '' }); setAddAccessUntil(null);
    } catch (err: unknown) { setAddError(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setAddLoading(false); }
  };

  const toggleActive = async (s: Student) => {
    await updateStudent({ id: s.id, is_active: !s.is_active });
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] bg-white" />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: '#E8002D' }}>
          <Icon name="UserPlus" size={15} />Добавить ученика
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400"><Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Ничего не найдено</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => {
              const expired = !!s.access_until && new Date(s.access_until).getTime() <= Date.now();
              return (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.is_active ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${s.is_active ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{s.name}</p>
                  <p className="text-xs text-gray-400">@{s.login}</p>
                </div>
                <span className={`hidden sm:inline text-xs ${expired ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {fmtAccessUntil(s.access_until)}
                </span>
                <button onClick={() => setEditStudent(s)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors">
                  <Icon name="Pencil" size={15} />
                </button>
                <button onClick={() => setRemoveTarget(s)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Icon name="Trash2" size={15} />
                </button>
                <button onClick={() => toggleActive(s)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${s.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                  {s.is_active ? 'Активен' : 'Заблокирован'}
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onUpdated={(s) => { setStudents(prev => prev.map(x => x.id === s.id ? s : x)); setEditStudent(null); }}
        />
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon name="Trash2" size={18} className="text-red-500" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2">Удалить ученика?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Ученик «{removeTarget.name}» и вся его история чата будут удалены безвозвратно. Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRemoveTarget(null)} disabled={removing}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60">
                Отмена
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={async () => {
                  setRemoving(true);
                  try {
                    await removeStudent(removeTarget.id);
                    setStudents(prev => prev.filter(s => s.id !== removeTarget.id));
                    setRemoveTarget(null);
                  } finally { setRemoving(false); }
                }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all bg-red-500"
              >
                {removing ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-montserrat font-bold text-lg">Добавить ученика</h3>
              <button onClick={() => setShowAdd(false)}><Icon name="X" size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {(['name', 'login'] as const).map(key => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {key === 'name' ? 'Имя и фамилия' : 'Логин'}
                  </label>
                  <input value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Пароль</label>
                <div className="flex gap-2">
                  <input value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Минимум 4 символа" required
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] font-mono" />
                  <button type="button" onClick={() => setAddForm(f => ({ ...f, password: generateDigitPassword() }))}
                    title="Сгенерировать цифровой пароль"
                    className="px-3.5 rounded-xl border border-gray-200 text-gray-500 hover:border-[#E8002D] hover:text-[#E8002D] transition-colors flex-shrink-0">
                    <Icon name="Dices" size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Заметка</label>
                <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
              </div>
              <AccessUntilPicker value={addAccessUntil} onChange={setAddAccessUntil} />
              {addError && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{addError}</div>}
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Отмена</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#E8002D' }}>{addLoading ? 'Сохранение...' : 'Добавить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Главная страница ──────────────────────────────────────────────────────────
export default function ManagerPage() {
  const [session, setSession] = useState<ManagerSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'students' | 'content' | 'pdd' | 'ai' | 'training' | 'support' | 'stats'>('students');

  useEffect(() => {
    managerMe()
      .then(s => { setSession(s); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      managerMe().catch(() => setSession(null));
    }, 20 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
      <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
    </div>
  );

  if (!session) return <LoginScreen onSuccess={s => setSession(s)} />;

  const p = session.permissions ?? {};
  const tabs = [
    p.students && { key: 'students', label: 'Ученики', icon: 'Users' },
    p.content && { key: 'content', label: 'Контент бота', icon: 'MessageSquare' },
    p.pdd && { key: 'pdd', label: 'ПДД', icon: 'BookOpen' },
    p.ai && { key: 'ai', label: 'AI-инструктор', icon: 'Brain' },
    p.ai && { key: 'training', label: 'Обучение ИИ', icon: 'Sparkles' },
    p.support && { key: 'support', label: 'Обращения', icon: 'LifeBuoy' },
    p.stats && { key: 'stats', label: 'Статистика', icon: 'BarChart2' },
  ].filter(Boolean) as { key: string; label: string; icon: string }[];

  // Автоматически переключаем на первый доступный таб
  const activeTab = tabs.find(t => t.key === tab) ? tab : (tabs[0]?.key as typeof tab) ?? 'students';

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-opensans">
      <header style={{ background: '#1a1a1a' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VectorLogo size="sm" inverted />
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="hidden sm:block">
            <p className="text-white text-sm font-semibold">{session.name}</p>
            <p className="text-white/40 text-xs">Менеджер</p>
          </div>
        </div>
        <button onClick={() => { managerLogout(); setSession(null); }}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
          <Icon name="LogOut" size={14} />Выйти
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {tabs.length > 1 && (
          <div className="mb-7 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-nowrap sm:flex-wrap gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 sm:w-fit overflow-x-auto no-scrollbar">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === t.key ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon name={t.icon} size={14} fallback="Settings" />{t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && p.students && <StudentsPanel />}
        {activeTab === 'content' && p.content && <ContentEditor />}
        {activeTab === 'pdd' && p.pdd && <PddManager />}
        {activeTab === 'ai' && p.ai && <AiSettings />}
        {activeTab === 'training' && p.ai && <AiTraining />}
        {activeTab === 'support' && p.support && <SupportTickets />}
        {activeTab === 'stats' && p.stats && <ChatLogs />}

        {tabs.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Icon name="Lock" size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">У вас нет прав доступа к разделам. Обратитесь к администратору.</p>
          </div>
        )}
      </div>
    </div>
  );
}