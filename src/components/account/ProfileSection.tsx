import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getStudentProfile, updateStudentProfile, StudentProfile } from '@/api/cabinet';

const STATUS_LABELS: Record<string, string> = {
  studying: 'Обучается',
  exam_ready: 'Готов к экзамену',
  finished: 'Завершил обучение',
  paused: 'Приостановлено',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProfileSection() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStudentProfile().then(d => { setStudent(d.student); setName(d.student.name); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateStudentProfile(name.trim());
      setStudent(s => s ? { ...s, name: name.trim() } : s);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !student) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  const fields: { label: string; value: string; icon: string }[] = [
    { label: 'Логин', value: student.login, icon: 'AtSign' },
    { label: 'Категория обучения', value: student.study_category, icon: 'Car' },
    { label: 'Группа', value: student.group_name || '—', icon: 'Users' },
    { label: 'Статус', value: STATUS_LABELS[student.study_status] || student.study_status, icon: 'BadgeCheck' },
    { label: 'Дата начала обучения', value: fmtDate(student.study_start_date || student.created_at), icon: 'Calendar' },
    { label: 'Доступ действует до', value: student.access_until ? fmtDate(student.access_until) : 'Бессрочно', icon: 'Clock' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Профиль</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: '#E8002D' }}>
            {student.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold outline-none focus:border-[#E8002D] transition-colors"
              />
            ) : (
              <p className="font-montserrat font-bold text-[#1a1a1a] truncate">{student.name}</p>
            )}
          </div>
          {editing ? (
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-60">
                <Icon name={saving ? 'Loader' : 'Check'} size={16} className={saving ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => { setEditing(false); setName(student.name); }} className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <Icon name="X" size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0">
              <Icon name="Pencil" size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mb-3">
            <Icon name="AlertCircle" size={13} />
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs mb-3">
            <Icon name="CheckCircle2" size={13} />
            Сохранено
          </div>
        )}

        <div className="flex flex-col divide-y divide-gray-50">
          {fields.map(f => (
            <div key={f.label} className="flex items-center gap-3 py-3">
              <Icon name={f.icon} size={15} className="text-gray-300 flex-shrink-0" fallback="Circle" />
              <span className="text-xs text-gray-400 flex-1">{f.label}</span>
              <span className="text-sm font-medium text-[#1a1a1a]">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Логин, пароль и срок доступа выдаются и меняются администратором автошколы
      </p>
    </div>
  );
}
