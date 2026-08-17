import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getNotificationsAdmin, sendNotification } from '@/api/cabinet';
import { getStudents } from '@/api/auth';

interface NotificationRow {
  id: number;
  title: string;
  message: string;
  target_type: string;
  target_group: string | null;
  target_student_name: string | null;
  created_at: string;
}

interface StudentOption { id: number; name: string; group_name?: string }

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const TARGET_LABELS: Record<string, string> = { all: 'Все ученики', group: 'Группа', student: 'Ученику' };

function SendForm({ students, onClose, onSent }: { students: StudentOption[]; onClose: () => void; onSent: (n: NotificationRow) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'group' | 'student'>('all');
  const [targetStudentId, setTargetStudentId] = useState<number | ''>('');
  const [targetGroup, setTargetGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await sendNotification({
        title, message, target_type: targetType,
        target_student_id: targetType === 'student' ? Number(targetStudentId) : undefined,
        target_group: targetType === 'group' ? targetGroup : undefined,
      });
      const studentName = targetType === 'student' ? students.find(s => s.id === Number(targetStudentId))?.name : null;
      onSent({ ...data.notification, target_student_name: studentName || null });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-montserrat font-bold text-base">Новое уведомление</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Заголовок</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Изменение расписания"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Текст сообщения</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Кому отправить</label>
            <div className="flex gap-2 mb-3">
              {(['all', 'group', 'student'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTargetType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${targetType === t ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {TARGET_LABELS[t]}
                </button>
              ))}
            </div>
            {targetType === 'group' && (
              <input value={targetGroup} onChange={e => setTargetGroup(e.target.value)} required placeholder="Название группы"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            )}
            {targetType === 'student' && (
              <select value={targetStudentId} onChange={e => setTargetStudentId(Number(e.target.value))} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors bg-white">
                <option value="">Выберите ученика</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotificationsManager() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([getNotificationsAdmin(), getStudents()])
      .then(([n, s]) => {
        setNotifications(n.notifications);
        setStudents(s.students);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Уведомления</h2>
          <p className="text-sm text-gray-400 mt-0.5">Сообщения, которые видят ученики в личном кабинете</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
          <Icon name="Send" size={15} />
          Отправить
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Bell" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Уведомлений пока не было</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a]">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0">
                  {n.target_type === 'student' ? n.target_student_name : n.target_type === 'group' ? n.target_group : 'Все'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{fmtDate(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SendForm students={students} onClose={() => setShowForm(false)} onSent={n => setNotifications(prev => [n, ...prev])} />
      )}
    </div>
  );
}
