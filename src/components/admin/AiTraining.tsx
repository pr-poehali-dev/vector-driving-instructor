import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { getTrainingSuggestions, reviewSuggestion, analyzeLogsNow, addManualSuggestion, AiTrainingSuggestion } from '@/api/ai';

function fmtDate(iso: string | null): string {
  if (!iso) return 'ещё не запускался';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── Форма ручного добавления правки от человека ──────────────────────────────
function ManualSuggestionForm({ onAdded }: { onAdded: (s: AiTrainingSuggestion) => void }) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState('');
  const [text, setText] = useState('');
  const [targetField, setTargetField] = useState<'extra_sources' | 'forbidden_topics'>('extra_sources');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await addManualSuggestion({ issue: issue.trim() || undefined, suggestion: text.trim(), target_field: targetField });
      onAdded({
        id: data.id,
        created_at: data.created_at,
        issue: issue.trim() || 'Ручное исправление',
        suggestion: text.trim(),
        target_field: targetField,
        sample_dialog: '',
        status: 'applied',
      });
      setIssue('');
      setText('');
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-semibold hover:border-[#E8002D] hover:text-[#E8002D] transition-all w-full"
      >
        <Icon name="Plus" size={15} />
        Обучить бота самостоятельно
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-montserrat font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
          <Icon name="GraduationCap" size={15} className="text-[#E8002D]" />
          Своя правка для ИИ
        </h4>
        <button type="button" onClick={() => setOpen(false)}><Icon name="X" size={16} className="text-gray-400" /></button>
      </div>

      <input
        value={issue}
        onChange={e => setIssue(e.target.value)}
        placeholder="Кратко: что не так (необязательно)"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#E8002D] transition-colors"
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Что именно должен запомнить бот (готовая формулировка правила/факта)..."
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Куда добавить:</span>
        <button type="button" onClick={() => setTargetField('extra_sources')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${targetField === 'extra_sources' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500'}`}>
          База знаний
        </button>
        <button type="button" onClick={() => setTargetField('forbidden_topics')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${targetField === 'forbidden_topics' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500'}`}>
          Запрещённые темы
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs">
          <Icon name="AlertCircle" size={13} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
        style={{ background: '#E8002D' }}
      >
        <Icon name={loading ? 'Loader' : 'Check'} size={14} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Сохранение...' : 'Добавить и применить сразу'}
      </button>
    </form>
  );
}

// ─── Карточка предложения с возможностью редактирования текста ───────────────
function SuggestionCard({ s, onReview }: { s: AiTrainingSuggestion; onReview: (id: number, decision: 'approve' | 'reject', edited?: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(s.suggestion);
  const [busy, setBusy] = useState(false);

  const handle = async (decision: 'approve' | 'reject') => {
    setBusy(true);
    try {
      await onReview(s.id, decision, editing ? text : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="AlertTriangle" size={15} className="text-amber-500" />
        <h4 className="font-montserrat font-bold text-sm text-[#1a1a1a]">{s.issue}</h4>
      </div>
      <p className="text-xs text-gray-400 mb-3">{fmtDate(s.created_at)}</p>

      {s.sample_dialog && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-500 whitespace-pre-line font-mono">
          {s.sample_dialog}
        </div>
      )}

      <div className="bg-red-50 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Предлагается добавить в базу знаний</p>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-[#E8002D] font-semibold flex items-center gap-1 hover:underline">
              <Icon name="Pencil" size={11} />
              Изменить текст
            </button>
          )}
        </div>
        {editing ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors bg-white"
          />
        ) : (
          <p className="text-sm text-[#1a1a1a]">{s.suggestion}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handle('approve')}
          disabled={busy || (editing && !text.trim())}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
        >
          <Icon name="Check" size={13} />
          {editing ? 'Сохранить и применить' : 'Применить'}
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 disabled:opacity-60 transition-all"
        >
          <Icon name="X" size={13} />
          Отклонить
        </button>
        {editing && (
          <button
            onClick={() => { setEditing(false); setText(s.suggestion); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 text-xs font-semibold hover:text-gray-600 transition-all"
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}

export default function AiTraining() {
  const [suggestions, setSuggestions] = useState<AiTrainingSuggestion[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [logsAnalyzed, setLogsAnalyzed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getTrainingSuggestions();
      setSuggestions(data.suggestions);
      setLastRun(data.last_run);
      setLogsAnalyzed(data.logs_analyzed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAnalyzeNow = async () => {
    setAnalyzing(true);
    setError('');
    try {
      await analyzeLogsNow();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка анализа');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReview = async (id: number, decision: 'approve' | 'reject', edited?: string) => {
    try {
      await reviewSuggestion(id, decision, edited);
      setSuggestions(list => list.map(s => s.id === id
        ? { ...s, status: decision === 'approve' ? 'applied' : 'rejected', suggestion: edited || s.suggestion }
        : s));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
  };

  const handleManualAdded = (s: AiTrainingSuggestion) => {
    setSuggestions(list => [s, ...list]);
  };

  const pending = suggestions.filter(s => s.status === 'pending');
  const reviewed = suggestions.filter(s => s.status !== 'pending');

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={16} className="text-[#E8002D]" />
            <div>
              <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Самообучение ИИ</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Раз в сутки система сама анализирует диалоги учеников и предлагает улучшения. Последний анализ: {fmtDate(lastRun)}
                {logsAnalyzed > 0 && ` · разобрано сообщений: ${logsAnalyzed}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyzeNow}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90 disabled:opacity-60 transition-all shrink-0"
            style={{ background: '#E8002D' }}
          >
            <Icon name={analyzing ? 'Loader' : 'RefreshCw'} size={13} className={analyzing ? 'animate-spin' : ''} />
            {analyzing ? 'Анализирую...' : 'Проверить сейчас'}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs mt-3">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}
      </div>

      <ManualSuggestionForm onAdded={handleManualAdded} />

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="CheckCircle2" size={28} className="mx-auto mb-2 text-green-400" />
          Новых предложений нет — ИИ пока не нашёл проблем в диалогах
        </div>
      )}

      {pending.map(s => <SuggestionCard key={s.id} s={s} onReview={handleReview} />)}

      {reviewed.length > 0 && (
        <details className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <summary className="cursor-pointer font-montserrat font-bold text-sm text-[#1a1a1a]">
            История решений ({reviewed.length})
          </summary>
          <div className="flex flex-col gap-3 mt-4">
            {reviewed.map(s => (
              <div key={s.id} className="flex items-start gap-2 text-xs border-t border-gray-100 pt-3">
                <Icon
                  name={s.status === 'applied' ? 'CheckCircle2' : 'XCircle'}
                  size={14}
                  className={s.status === 'applied' ? 'text-green-500 mt-0.5' : 'text-gray-400 mt-0.5'}
                />
                <div>
                  <p className="text-gray-600">{s.issue}</p>
                  <p className="text-gray-400 mt-0.5">{s.status === 'applied' ? 'Применено' : 'Отклонено'} · {fmtDate(s.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
