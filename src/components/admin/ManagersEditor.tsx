import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Manager, getManagers, addManager, updateManager, removeManager } from '@/api/managers';

function fmtDate(iso: string | null): string {
  if (!iso) return 'не заходил';
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 2) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD < 7) return `${diffD} д. назад`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const PERM_LABELS = [
  { key: 'can_students', label: 'Ученики', desc: 'Добавлять и редактировать учеников', icon: 'Users' },
  { key: 'can_content', label: 'Контент бота', desc: 'Темы и сообщения чат-бота', icon: 'MessageSquare' },
  { key: 'can_ai', label: 'AI-инструктор', desc: 'Настройки AI', icon: 'Brain' },
  { key: 'can_support', label: 'Обращения', desc: 'Обращения учеников в поддержку', icon: 'LifeBuoy' },
  { key: 'can_stats', label: 'Статистика', desc: 'Только просмотр', icon: 'BarChart2' },
] as const;

type PermKey = typeof PERM_LABELS[number]['key'];

// ── Форма добавления / редактирования ─────────────────────────────────────────
function ManagerForm({ manager, onClose, onSaved }: {
  manager?: Manager | null;
  onClose: () => void;
  onSaved: (m: Manager) => void;
}) {
  const [form, setForm] = useState({
    name: manager?.name || '',
    login: manager?.login || '',
    password: '',
    can_students: manager?.can_students ?? false,
    can_content: manager?.can_content ?? false,
    can_ai: manager?.can_ai ?? false,
    can_stats: manager?.can_stats ?? false,
    can_support: manager?.can_support ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (key: PermKey) => setForm(f => ({ ...f, [key]: !f[key] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data;
      if (manager) {
        data = await updateManager({ id: manager.id, ...form });
      } else {
        data = await addManager(form);
      }
      onSaved(data.manager);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg === 'Доступ запрещён' ? 'Сессия истекла. Обнови страницу и войди заново.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-montserrat font-bold text-base">{manager ? 'Редактировать менеджера' : 'Новый менеджер'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Имя *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                placeholder="Иван Иванов"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Логин *</label>
              <input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                required={!manager} disabled={!!manager}
                placeholder="ivanov"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {manager ? 'Новый пароль (оставь пустым чтобы не менять)' : 'Пароль *'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={!manager} placeholder="Минимум 4 символа"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Права доступа</label>
            <div className="flex flex-col gap-2">
              {PERM_LABELS.map(p => (
                <label key={p.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors">
                  <div
                    onClick={() => toggle(p.key)}
                    className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${form[p.key] ? 'bg-[#E8002D]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form[p.key] ? 'left-5' : 'left-1'}`} />
                  </div>
                  <Icon name={p.icon} size={15} className={form[p.key] ? 'text-[#E8002D]' : 'text-gray-400'} fallback="Settings" />
                  <div>
                    <p className={`text-sm font-medium ${form[p.key] ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>{p.label}</p>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : manager ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function ManagersEditor() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Manager | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Manager | null>(null);

  useEffect(() => {
    getManagers()
      .then(d => { setManagers(d.managers); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSaved = (m: Manager) => {
    setManagers(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
      return [m, ...prev];
    });
  };

  const handleRemove = async (m: Manager) => {
    await removeManager(m.id);
    setManagers(prev => prev.map(x => x.id === m.id ? { ...x, is_active: false } : x));
    setConfirmRemove(null);
  };

  const active = managers.filter(m => m.is_active);
  const inactive = managers.filter(m => !m.is_active);

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Менеджеры</h2>
          <p className="text-sm text-gray-400 mt-0.5">Сотрудники с ограниченным доступом к кабинету</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: '#E8002D' }}>
          <Icon name="UserPlus" size={15} />
          Добавить
        </button>
      </div>

      {active.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Users" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Менеджеров пока нет</p>
          <button onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="mt-4 text-[#E8002D] text-sm font-semibold hover:underline">
            Добавить первого менеджера →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#1a1a1a]">{m.name}</p>
                    <p className="text-xs text-gray-400">@{m.login}</p>
                    <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1">
                      <Icon name="Clock" size={10} />
                      {fmtDate(m.last_seen)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditTarget(m); setShowForm(true); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmRemove(m)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {PERM_LABELS.map(p => m[p.key] && (
                  <span key={p.key} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Icon name={p.icon} size={11} fallback="Settings" />
                    {p.label}
                  </span>
                ))}
                {!PERM_LABELS.some(p => m[p.key]) && (
                  <span className="text-xs text-gray-400 italic">Нет прав</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="text-xs text-gray-400 text-center">
          + {inactive.length} деактивированных менеджеров
        </div>
      )}

      {showForm && (
        <ManagerForm
          manager={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-montserrat font-bold text-base mb-2">Удалить менеджера?</h3>
            <p className="text-sm text-gray-500 mb-5">«{confirmRemove.name}» потеряет доступ к кабинету.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
              <button onClick={() => handleRemove(confirmRemove)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}