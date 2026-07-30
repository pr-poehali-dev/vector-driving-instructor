import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { getSupportTickets, updateSupportTicket, SupportTicket } from '@/api/support';

function fmtDate(iso: string): string {
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

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Новое', color: 'text-amber-600', bg: 'bg-amber-50' },
  in_progress: { label: 'В работе', color: 'text-blue-600', bg: 'bg-blue-50' },
  resolved: { label: 'Решено', color: 'text-green-600', bg: 'bg-green-50' },
};

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'resolved', label: 'Решённые' },
];

function TicketCard({ ticket, onUpdate }: { ticket: SupportTicket; onUpdate: (t: SupportTicket) => void }) {
  const [note, setNote] = useState(ticket.admin_note);
  const [busy, setBusy] = useState(false);

  const handleStatusChange = async (status: string) => {
    setBusy(true);
    try {
      const data = await updateSupportTicket(ticket.id, { status });
      onUpdate(data.ticket);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNote = async () => {
    setBusy(true);
    try {
      const data = await updateSupportTicket(ticket.id, { admin_note: note });
      onUpdate(data.ticket);
    } finally {
      setBusy(false);
    }
  };

  const st = STATUS_LABELS[ticket.status] || STATUS_LABELS.new;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon name="User" size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-[#1a1a1a]">{ticket.student_name || 'Аноним'}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>{st.label}</span>
        </div>
        <span className="text-xs text-gray-400">{fmtDate(ticket.created_at)}</span>
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 mb-3">{ticket.message}</p>

      <div className="flex flex-col gap-2">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Заметка для себя / что сделано..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#E8002D] resize-none transition-colors"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5">
            {(['new', 'in_progress', 'resolved'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={busy || ticket.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                  ticket.status === s ? `${STATUS_LABELS[s].color} ${STATUS_LABELS[s].bg}` : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {STATUS_LABELS[s].label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveNote}
            disabled={busy || note === ticket.admin_note}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 disabled:opacity-40 transition-all"
          >
            <Icon name="Save" size={12} />
            Сохранить заметку
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getSupportTickets();
      setTickets(data.tickets);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated: SupportTicket) => {
    setTickets(list => list.map(t => t.id === updated.id ? updated : t));
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const newCount = tickets.filter(t => t.status === 'new').length;

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a] flex items-center gap-2">
            <Icon name="LifeBuoy" size={18} className="text-[#E8002D]" />
            Обращения учеников
            {newCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-[#E8002D]">{newCount} новых</span>}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Вопросы и проблемы, о которых написали ученики напрямую</p>
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
          {FILTERS.map(f => (
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

      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="Inbox" size={28} className="mx-auto mb-2 text-gray-200" />
          Обращений нет
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(t => <TicketCard key={t.id} ticket={t} onUpdate={handleUpdate} />)}
        </div>
      )}
    </div>
  );
}
