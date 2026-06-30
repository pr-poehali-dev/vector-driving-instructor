import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

interface LogEntry {
  id: number;
  actor_type: 'admin' | 'manager';
  actor_id: number | null;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  target_name: string | null;
  details: string | null;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  add_student:    { label: 'Добавил ученика',      icon: 'UserPlus',    color: '#16a34a' },
  update_student: { label: 'Изменил ученика',      icon: 'UserCog',     color: '#2563eb' },
  add_manager:    { label: 'Добавил менеджера',    icon: 'UserPlus',    color: '#7c3aed' },
  update_manager: { label: 'Изменил менеджера',    icon: 'UserCog',     color: '#7c3aed' },
  remove_manager: { label: 'Деактивировал менеджера', icon: 'UserMinus', color: '#E8002D' },
  add_topic:      { label: 'Добавил тему',         icon: 'FolderPlus',  color: '#16a34a' },
  update_topic:   { label: 'Изменил тему',         icon: 'FolderEdit',  color: '#2563eb' },
  delete_topic:   { label: 'Удалил тему',          icon: 'Trash2',      color: '#E8002D' },
  add_message:    { label: 'Добавил сообщение',    icon: 'MessageSquarePlus', color: '#16a34a' },
  update_message: { label: 'Изменил сообщение',    icon: 'MessageSquare', color: '#2563eb' },
  delete_message: { label: 'Удалил сообщение',     icon: 'Trash2',      color: '#E8002D' },
};

function fmtDateFull(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function groupByDay(entries: LogEntry[]): { date: string; items: LogEntry[] }[] {
  const groups: Record<string, LogEntry[]> = {};
  for (const e of entries) {
    const day = new Date(e.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

export default function ActivityLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'manager'>('all');

  useEffect(() => {
    const token = localStorage.getItem('vector_admin_token') || '';
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({ action: 'activity_log', limit: 200 }),
    })
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => filter === 'all' || e.actor_type === filter);
  const groups = groupByDay(filtered);

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка журнала...
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Журнал действий</h2>
          <p className="text-sm text-gray-400 mt-0.5">Все изменения в кабинете — кто, что и когда</p>
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
          {([
            { key: 'all', label: 'Все' },
            { key: 'admin', label: 'Администратор' },
            { key: 'manager', label: 'Менеджеры' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Icon name="ClipboardList" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Действий пока нет</p>
          <p className="text-gray-300 text-xs mt-1">Здесь будут отображаться все изменения</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ date, items }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">{items.length} действий</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map(e => {
                  const meta = ACTION_META[e.action] || { label: e.action, icon: 'Activity', color: '#6b7280' };
                  return (
                    <div key={e.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: meta.color + '15' }}>
                        <Icon name={meta.icon} size={15} style={{ color: meta.color }} fallback="Activity" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#1a1a1a]">{e.actor_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            e.actor_type === 'admin'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {e.actor_type === 'admin' ? 'Администратор' : 'Менеджер'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          <span style={{ color: meta.color }} className="font-medium">{meta.label}</span>
                          {e.target_name && <span className="text-gray-500"> — {e.target_name}</span>}
                        </p>
                        {e.details && (
                          <p className="text-xs text-gray-400 mt-0.5">{e.details}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-300 mt-1">{fmtDateFull(e.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
