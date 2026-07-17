import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getLogsStudents, getLogsHistory, getLogsStats, getLogsOnline } from '@/api/content';

interface LogStudent {
  student_id: number;
  student_name: string;
  messages_count: number;
  last_active: string;
}

interface LogMessage {
  id: number;
  mode: string;
  role: 'user' | 'bot';
  message: string;
  created_at: string;
}

interface OnlineStudent {
  student_id: number;
  student_name: string;
  login_at: string;
  last_seen: string | null;
  is_active_now: boolean;
  last_action: string | null;
  last_mode: string | null;
}

interface Stats {
  unique_students: number;
  total_questions: number;
  today_questions: number;
  week_questions: number;
  ai_questions: number;
  topic_questions: number;
  total_students: number;
  active_students: number;
  online_now: number;
  active_now: number;
  top_topics: { topic_label: string; views: number }[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function modeLabel(mode: string) {
  return mode === 'ai' ? 'AI-инструктор' : 'Тема';
}

export default function ChatLogs() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [online, setOnline] = useState<OnlineStudent[]>([]);
  const [students, setStudents] = useState<LogStudent[]>([]);
  const [selected, setSelected] = useState<LogStudent | null>(null);
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadAll = () => {
    getLogsStats().then(d => setStats(d.stats)).catch(() => {});
    getLogsOnline().then(d => setOnline(d.online || [])).catch(() => {});
  };

  useEffect(() => {
    loadAll();
    getLogsStudents()
      .then(d => { setStudents(d.students || []); setLoadingStudents(false); })
      .catch(() => setLoadingStudents(false));
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openHistory = async (student: LogStudent) => {
    setSelected(student);
    setLoadingHistory(true);
    setMessages([]);
    try {
      const d = await getLogsHistory(student.student_id);
      setMessages(d.messages || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = students.filter(s =>
    s.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Группируем сообщения по дням
  const grouped: { day: string; msgs: LogMessage[] }[] = [];
  messages.forEach(m => {
    const day = formatDay(m.created_at);
    const last = grouped[grouped.length - 1];
    if (!last || last.day !== day) grouped.push({ day, msgs: [m] });
    else last.msgs.push(m);
  });

  return (
    <div className="flex flex-col gap-6">

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Активны прямо сейчас', val: stats.active_now, icon: 'Zap', color: '#16a34a' },
            { label: 'Авторизовано', val: stats.online_now, icon: 'Radio', color: '#16a34a' },
            { label: 'Всего учеников', val: stats.total_students, icon: 'Users', color: '#1a1a1a' },
            { label: 'Активных доступов', val: stats.active_students, icon: 'UserCheck', color: '#1a1a1a' },
            { label: 'Учеников в чате', val: stats.unique_students, icon: 'MessageSquare', color: '#7c3aed' },
            { label: 'Вопросов темам', val: stats.topic_questions, icon: 'ListTree', color: '#0ea5e9' },
            { label: 'Вопросов AI', val: stats.ai_questions, icon: 'Sparkles', color: '#7c3aed' },
            { label: 'За сегодня', val: stats.today_questions, icon: 'Zap', color: '#E8002D' },
            { label: 'За неделю', val: stats.week_questions, icon: 'TrendingUp', color: '#16a34a' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400 uppercase tracking-wide leading-tight">{s.label}</span>
                <Icon name={s.icon} size={14} className="text-gray-300" fallback="Activity" />
              </div>
              <div className="font-montserrat text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Сейчас онлайн */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Авторизованные ученики</h3>
          <span className="text-xs text-gray-400">({online.length})</span>
        </div>
        {online.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">Никто не авторизован</div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {online.map(o => (
              <div key={o.student_id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                    {o.student_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {o.is_active_now && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" title="Активен прямо сейчас" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{o.student_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {o.last_mode ? `${modeLabel(o.last_mode)}: ${o.last_action}` : 'зашёл, ещё не писал'}
                  </p>
                </div>
                <span className={`text-xs flex-shrink-0 ${o.is_active_now ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                  {o.is_active_now ? 'сейчас' : (o.last_seen ? formatDate(o.last_seen) : '')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Топ тем */}
      {stats && stats.top_topics.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Популярные темы</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.top_topics.map((t, i) => (
              <div key={t.topic_label} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-5 text-xs text-gray-400 font-semibold flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{t.topic_label}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{t.views} раз</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4" style={{ height: '520px' }}>

        {/* Список учеников */}
        <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#E8002D]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingStudents ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Icon name="Loader" size={18} className="animate-spin mx-auto mb-2" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm px-4">
                <Icon name="MessageSquare" size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Пока нет переписок</p>
              </div>
            ) : (
              filtered.map(s => {
                const isOnline = online.some(o => o.student_id === s.student_id && o.is_active_now);
                return (
                <button key={s.student_id} onClick={() => openHistory(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.student_id === s.student_id ? 'bg-red-50 border-l-2 border-l-[#E8002D]' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">
                        {s.student_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.student_name || 'Неизвестно'}</p>
                      <p className="text-xs text-gray-400">{s.messages_count} вопр. · {formatDate(s.last_active)}</p>
                    </div>
                  </div>
                </button>
                );
              })
            )}
          </div>
        </div>

        {/* История переписки */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Выбери ученика слева</p>
              </div>
            </div>
          ) : (
            <>
              {/* Шапка */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold">
                  {selected.student_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a1a]">{selected.student_name}</p>
                  <p className="text-xs text-gray-400">{selected.messages_count} вопросов · последний раз {formatDate(selected.last_active)}</p>
                </div>
              </div>

              {/* Сообщения */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-[#f4f6fa]">
                {loadingHistory ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Icon name="Loader" size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">История пуста</div>
                ) : (
                  grouped.map(({ day, msgs }) => (
                    <div key={day}>
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 px-2">{day}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      {msgs.map(m => (
                        <div key={m.id} className={`flex mb-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {m.role === 'bot' && (
                            <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-0.5">
                              <Icon name="Sparkles" size={12} className="text-white" />
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-[#E8002D] text-white rounded-tr-sm'
                              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                          }`}>
                            {m.role === 'user' && (
                              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide mb-1 px-1.5 py-0.5 rounded ${m.mode === 'ai' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
                                {modeLabel(m.mode)}
                              </span>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                            <p className={`text-xs mt-1 ${m.role === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                              {formatTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}