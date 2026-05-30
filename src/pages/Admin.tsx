import { useState, useEffect } from 'react';
import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';
import { adminLogin, adminMe, adminLogout, getStudents, addStudent, updateStudent } from '@/api/auth';
import ContentEditor from '@/components/admin/ContentEditor';
import AiSettings from '@/components/admin/AiSettings';
import ManagersEditor from '@/components/admin/ManagersEditor';
import ChatLogs from '@/components/admin/ChatLogs';

interface Student {
  id: number;
  name: string;
  login: string;
  is_active: boolean;
  notes: string;
  created_at: string;
}

// ─── Login screen ────────────────────────────────────────────────────────────
const RESET_TOKEN = 'RESET-VECTOR-2026';

function AdminLoginScreen({ onSuccess }: { onSuccess: (isReset?: boolean) => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password.trim());
      onSuccess(password.trim() === RESET_TOKEN);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неверный пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] px-4 font-opensans">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: '#1a1a1a' }}>
          <div className="flex justify-center mb-4"><VectorLogo size="md" inverted /></div>
          <p className="text-white/50 text-sm mt-2">Кабинет администратора</p>
        </div>
        <form onSubmit={submit} className="px-8 py-7 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Пароль администратора</label>
            <div className="relative">
              <Icon name="Lock" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon name={showPw ? 'EyeOff' : 'Eye'} size={15} />
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm">
              <Icon name="AlertCircle" size={14} />{error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-montserrat font-bold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: '#E8002D' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setShowHint(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Забыли пароль?
            </button>
            {showHint && (
              <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <p className="text-xs text-amber-800 font-semibold mb-1">Одноразовый код сброса:</p>
                <code className="text-sm font-bold text-amber-900 select-all">{RESET_TOKEN}</code>
                <p className="text-xs text-amber-700 mt-1">Введите его вместо пароля — вы войдёте и сможете установить новый.</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add student modal ───────────────────────────────────────────────────────
function AddStudentModal({ onClose, onAdded }: { onClose: () => void; onAdded: (s: Student) => void }) {
  const [form, setForm] = useState({ name: '', login: '', password: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await addStudent(form);
      onAdded(data.student);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        required={key !== 'notes'}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Добавить ученика</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={18} /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {field('name', 'Имя и фамилия', 'text', 'Иван Иванов')}
          {field('login', 'Логин', 'text', 'ivanov')}
          {field('password', 'Пароль', 'text', 'Минимум 4 символа')}
          {field('notes', 'Заметка (необязательно)', 'text', 'Группа A, начало курса...')}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm">
              <Icon name="AlertCircle" size={13} />{error}
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit modal ──────────────────────────────────────────────────────────────
function EditStudentModal({ student, onClose, onUpdated }: { student: Student; onClose: () => void; onUpdated: (s: Student) => void }) {
  const [form, setForm] = useState({ name: student.name, notes: student.notes || '', is_active: student.is_active, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Parameters<typeof updateStudent>[0] = { id: student.id, name: form.name, notes: form.notes, is_active: form.is_active };
      if (form.password) payload.password = form.password;
      const data = await updateStudent(payload);
      onUpdated(data.student);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Редактировать ученика</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={18} /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Имя</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Новый пароль (если нужно сменить)</label>
            <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Оставьте пустым, чтобы не менять"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
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
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm">
              <Icon name="AlertCircle" size={13} />{error}
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [tab, setTab] = useState<'students' | 'content'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    getStudents().then(d => setStudents(d.students)).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.login.toLowerCase().includes(search.toLowerCase())
  );

  const active = students.filter(s => s.is_active).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-opensans">
      {/* Header */}
      <header style={{ background: '#1a1a1a' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VectorLogo size="sm" inverted />
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <span className="hidden sm:block text-white/60 text-sm">Кабинет администратора</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChangePw(true)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <Icon name="KeyRound" size={14} />
            <span className="hidden sm:inline">Сменить пароль</span>
          </button>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={() => { adminLogout(); window.location.reload(); }}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
          >
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </header>

      {showChangePw && <ChangePasswordScreen onDone={() => setShowChangePw(false)} inline />}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-7 w-fit">
          {([
            { key: 'students', label: 'Ученики', icon: 'Users' },
            { key: 'content', label: 'Контент бота', icon: 'MessageSquare' },
            { key: 'ai', label: 'AI-инструктор', icon: 'Brain' },
            { key: 'managers', label: 'Менеджеры', icon: 'UserCog' },
            { key: 'logs', label: 'Переписка', icon: 'MessagesSquare' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#1a1a1a] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name={t.icon} size={14} fallback="Users" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'content' && <ContentEditor />}
        {tab === 'ai' && <AiSettings />}
        {tab === 'managers' && <ManagersEditor />}
        {tab === 'logs' && <ChatLogs />}

        {tab === 'students' && <>
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени или логину..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors bg-white"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: '#E8002D' }}
          >
            <Icon name="UserPlus" size={15} />
            Добавить ученика
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'Ничего не найдено' : 'Учеников пока нет'}</p>
              {!search && (
                <button onClick={() => setShowAdd(true)} className="mt-4 text-[#E8002D] text-sm font-semibold hover:underline">
                  Добавить первого ученика →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Table head */}
              <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                <div className="col-span-4">Имя</div>
                <div className="col-span-3">Логин</div>
                <div className="col-span-2 hidden sm:block">Заметка</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-1"></div>
              </div>
              {filtered.map(s => (
                <div key={s.id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: s.is_active ? '#1a1a1a' : '#d1d5db' }}>
                      {s.name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                  </div>
                  <div className="col-span-3 text-sm text-gray-500 font-mono truncate">{s.login}</div>
                  <div className="col-span-2 hidden sm:block text-xs text-gray-400 truncate">{s.notes || '—'}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      s.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {s.is_active ? 'Активен' : 'Заблок.'}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setEditStudent(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Логин и пароль от чат-бота выдаётся ученику лично. Доступ можно заблокировать в любой момент.
        </p>

        {showAdd && (
          <AddStudentModal
            onClose={() => setShowAdd(false)}
            onAdded={s => setStudents(prev => [s, ...prev])}
          />
        )}
        {editStudent && (
          <EditStudentModal
            student={editStudent}
            onClose={() => setEditStudent(null)}
            onUpdated={updated => {
              setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
            }}
          />
        )}
        </>}
      </div>
    </div>
  );
}

// ─── Change password screen ───────────────────────────────────────────────────
function ChangePasswordScreen({ onDone, inline }: { onDone: () => void; inline?: boolean }) {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { setError('Пароли не совпадают'); return; }
    if (newPw.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('vector_admin_token') || '';
      const res = await fetch('https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ action: 'admin-set-password', new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setSuccess(true);
      setTimeout(onDone, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setLoading(false); }
  };

  const form = (
    <>
      {success ? (
        <div className="px-8 py-8 text-center">
          <Icon name="CheckCircle" size={36} className="mx-auto mb-3 text-green-500" />
          <p className="text-gray-700 font-semibold">Пароль обновлён!</p>
          <p className="text-gray-400 text-sm mt-1">Используйте его при следующем входе.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Новый пароль</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Минимум 6 символов"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Повторите пароль</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Ещё раз"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>
          {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3">
            {inline && <button type="button" onClick={onDone}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>}
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-white font-montserrat font-bold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onDone}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-montserrat font-bold text-base">Смена пароля</h3>
            <button onClick={onDone}><Icon name="X" size={18} className="text-gray-400" /></button>
          </div>
          {form}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] px-4 font-opensans">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: '#1a1a1a' }}>
          <div className="flex justify-center mb-4"><VectorLogo size="md" inverted /></div>
          <p className="text-white/50 text-sm mt-2">Установите новый пароль</p>
        </div>
        {form}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [needsReset, setNeedsReset] = useState(false);

  useEffect(() => {
    adminMe().then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <Icon name="Loader" size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!authed) return <AdminLoginScreen onSuccess={(isReset?: boolean) => { setAuthed(true); if (isReset) setNeedsReset(true); }} />;
  if (needsReset) return <ChangePasswordScreen onDone={() => setNeedsReset(false)} />;
  return <AdminDashboard />;
}