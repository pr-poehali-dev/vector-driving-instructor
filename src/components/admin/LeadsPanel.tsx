import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { getLeads, updateLead, deleteLead, type Lead, type LeadStatus } from '@/api/home';

const STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: 'Новая', cls: 'bg-red-50 text-red-600' },
  in_work: { label: 'В работе', cls: 'bg-amber-50 text-amber-700' },
  done: { label: 'Записан', cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'Отказ', cls: 'bg-gray-100 text-gray-500' },
};

const FILTERS: { key: LeadStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'in_work', label: 'В работе' },
  { key: 'done', label: 'Записаны' },
  { key: 'rejected', label: 'Отказ' },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function LeadCard({ lead, onChange, onRemove }: { lead: Lead; onChange: (l: Lead) => void; onRemove: (id: number) => void }) {
  const [note, setNote] = useState(lead.note);
  const [saving, setSaving] = useState(false);
  const tel = lead.phone.replace(/[^\d+]/g, '');

  const setStatus = async (status: LeadStatus) => {
    await updateLead(lead.id, { status });
    onChange({ ...lead, status });
  };

  const saveNote = async () => {
    if (note === lead.note) return;
    setSaving(true);
    try {
      await updateLead(lead.id, { note });
      onChange({ ...lead, note });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[#1a1a1a] truncate">{lead.name}</p>
          <a href={`tel:${tel}`} className="text-[#E8002D] font-semibold text-sm">{lead.phone}</a>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS[lead.status].cls}`}>{STATUS[lead.status].label}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Icon name="Clock" size={12} />{fmtDate(lead.created_at)}</span>
        {lead.branch && <span className="flex items-center gap-1"><Icon name="MapPin" size={12} />{lead.branch}</span>}
        {lead.category && <span className="flex items-center gap-1"><Icon name="Car" size={12} />{lead.category}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(STATUS) as LeadStatus[]).map(s => (
          <button key={s} onClick={() => setStatus(s)} disabled={lead.status === s}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              lead.status === s ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {STATUS[s].label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} placeholder="Заметка: о чём договорились"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]" />
        {saving && <Icon name="Loader" size={14} className="animate-spin text-gray-300 self-center" />}
        <button onClick={() => { if (window.confirm('Удалить заявку?')) onRemove(lead.id); }} title="Удалить"
          className="p-2 text-gray-300 hover:text-red-500"><Icon name="Trash2" size={16} /></button>
      </div>
    </div>
  );
}

export default function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('new');
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await getLeads(filter === 'all' ? undefined : filter);
      setLeads(d.leads);
      setNewCount(d.new_count);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const change = (l: Lead) => {
    setLeads(prev => (filter !== 'all' && l.status !== filter ? prev.filter(x => x.id !== l.id) : prev.map(x => (x.id === l.id ? l : x))));
    load();
  };

  const remove = async (id: number) => {
    await deleteLead(id);
    setLeads(prev => prev.filter(x => x.id !== id));
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Заявки с сайта</h2>
          <p className="text-sm text-gray-400 mt-0.5">{newCount > 0 ? `Новых: ${newCount}` : 'Новых заявок нет'}</p>
        </div>
        <button onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300">
          <Icon name="RefreshCw" size={14} />Обновить
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:text-gray-800'
            }`}>
            {f.label}{f.key === 'new' && newCount > 0 ? ` · ${newCount}` : ''}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}
      {loading ? (
        <div className="py-12 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Inbox" size={30} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">Заявок пока нет</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {leads.map(l => <LeadCard key={`${l.id}-${l.status}`} lead={l} onChange={change} onRemove={remove} />)}
        </div>
      )}
    </div>
  );
}
