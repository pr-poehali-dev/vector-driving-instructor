import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Branch, getBranches, addBranch, updateBranch, removeBranch } from '@/api/branches';

// ── Форма добавления / редактирования ─────────────────────────────────────────
function BranchForm({ branch, onClose, onSaved }: {
  branch?: Branch | null;
  onClose: () => void;
  onSaved: (b: Branch) => void;
}) {
  const [form, setForm] = useState({
    name: branch?.name || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    work_hours: branch?.work_hours || 'Пн–Вс: 8:30–20:30',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = branch ? await updateBranch({ id: branch.id, ...form }) : await addBranch(form);
      onSaved(data.branch);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        required
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-montserrat font-bold text-base">{branch ? 'Редактировать филиал' : 'Новый филиал'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          {field('name', 'Название', 'Курган, 4-й микрорайон')}
          {field('address', 'Адрес', 'г. Курган, 4-й микрорайон, 32')}
          {field('phone', 'Телефон', '8 (919) 591-55-58')}
          {field('work_hours', 'Режим работы', 'Пн–Вс: 8:30–20:30')}
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : branch ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function BranchesEditor() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Branch | null>(null);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    getBranches()
      .then(d => { setBranches(d.branches); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSaved = (b: Branch) => {
    setBranches(prev => {
      const idx = prev.findIndex(x => x.id === b.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = b; return next; }
      return [...prev, b];
    });
  };

  const handleRemove = async (b: Branch) => {
    setRemoveError('');
    try {
      await removeBranch(b.id);
      setBranches(prev => prev.filter(x => x.id !== b.id));
      setConfirmRemove(null);
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Филиалы</h2>
          <p className="text-sm text-gray-400 mt-0.5">Адреса и телефоны, которые ученики выбирают на сайте</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: '#E8002D' }}>
          <Icon name="Plus" size={15} />
          Добавить
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="MapPin" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Филиалов пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {branches.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fff0f2] flex items-center justify-center flex-shrink-0">
                    <Icon name="MapPin" size={16} className="text-[#E8002D]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-[#1a1a1a]">{b.name}</p>
                      {b.is_default && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium uppercase tracking-wide">По умолчанию</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.phone} · {b.work_hours}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditTarget(b); setShowForm(true); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors">
                    <Icon name="Pencil" size={14} />
                  </button>
                  {!b.is_default && (
                    <button onClick={() => { setConfirmRemove(b); setRemoveError(''); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BranchForm
          branch={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon name="Trash2" size={18} className="text-red-500" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2">Удалить филиал?</h3>
            <p className="text-sm text-gray-500 mb-5">Филиал «{confirmRemove.name}» будет удалён безвозвратно.</p>
            {removeError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-4">{removeError}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Отмена
              </button>
              <button type="button" onClick={() => handleRemove(confirmRemove)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all bg-red-500">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
