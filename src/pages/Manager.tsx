import { useState, useEffect } from 'react';
import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';
import ContentEditor from '@/components/admin/ContentEditor';
import AiSettings from '@/components/admin/AiSettings';
import { managerLogin, managerMe, managerLogout, ManagerSession } from '@/api/managers';
import { getStudents, addStudent, updateStudent } from '@/api/auth';

interface Student {
  id: number; name: string; login: string; is_active: boolean; notes: string; created_at: string;
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

// ── Таблица учеников (упрощённая) ─────────────────────────────────────────────
function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', login: '', password: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    getStudents().then(d => { setStudents(d.students || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.login.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(''); setAddLoading(true);
    try {
      const data = await addStudent(addForm);
      setStudents(prev => [data.student, ...prev]);
      setShowAdd(false); setAddForm({ name: '', login: '', password: '', notes: '' });
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
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.is_active ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${s.is_active ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{s.name}</p>
                  <p className="text-xs text-gray-400">@{s.login}</p>
                </div>
                <button onClick={() => toggleActive(s)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${s.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                  {s.is_active ? 'Активен' : 'Заблокирован'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-montserrat font-bold text-lg">Добавить ученика</h3>
              <button onClick={() => setShowAdd(false)}><Icon name="X" size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {(['name', 'login', 'password', 'notes'] as const).map(key => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {key === 'name' ? 'Имя и фамилия' : key === 'login' ? 'Логин' : key === 'password' ? 'Пароль' : 'Заметка'}
                  </label>
                  <input value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    required={key !== 'notes'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
                </div>
              ))}
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

// ── Статистика ────────────────────────────────────────────────────────────────
function StatsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  useEffect(() => {
    getStudents().then(d => setStudents(d.students || [])).catch(() => {});
  }, []);
  const active = students.filter(s => s.is_active).length;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[
        { label: 'Всего учеников', val: students.length, icon: 'Users', color: '#1a1a1a' },
        { label: 'Активных', val: active, icon: 'UserCheck', color: '#16a34a' },
        { label: 'Заблокированных', val: students.length - active, icon: 'UserX', color: '#E8002D' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</span>
            <Icon name={s.icon} size={16} className="text-gray-300" fallback="Users" />
          </div>
          <div className="font-montserrat text-3xl font-black" style={{ color: s.color }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

// ── Главная страница ──────────────────────────────────────────────────────────
export default function ManagerPage() {
  const [session, setSession] = useState<ManagerSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'students' | 'content' | 'ai' | 'stats'>('students');

  useEffect(() => {
    managerMe()
      .then(s => { setSession(s); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
      <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
    </div>
  );

  if (!session) return <LoginScreen onSuccess={s => setSession(s)} />;

  const p = session.permissions;
  const tabs = [
    p.students && { key: 'students', label: 'Ученики', icon: 'Users' },
    p.content && { key: 'content', label: 'Контент бота', icon: 'MessageSquare' },
    p.ai && { key: 'ai', label: 'AI-инструктор', icon: 'Brain' },
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
          <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-7 w-fit flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.key ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon name={t.icon} size={14} fallback="Settings" />{t.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'students' && p.students && <StudentsPanel />}
        {activeTab === 'content' && p.content && <ContentEditor />}
        {activeTab === 'ai' && p.ai && <AiSettings />}
        {activeTab === 'stats' && p.stats && <StatsPanel />}

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