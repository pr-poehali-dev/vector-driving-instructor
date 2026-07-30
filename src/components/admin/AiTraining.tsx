import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { getTrainingSuggestions, reviewSuggestion, analyzeLogsNow, AiTrainingSuggestion } from '@/api/ai';

function fmtDate(iso: string | null): string {
  if (!iso) return 'ещё не запускался';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AiTraining() {
  const [suggestions, setSuggestions] = useState<AiTrainingSuggestion[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [logsAnalyzed, setLogsAnalyzed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
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

  const handleReview = async (id: number, decision: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await reviewSuggestion(id, decision);
      setSuggestions(list => list.map(s => s.id === id ? { ...s, status: decision === 'approve' ? 'applied' : 'rejected' } : s));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setBusyId(null);
    }
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

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="CheckCircle2" size={28} className="mx-auto mb-2 text-green-400" />
          Новых предложений нет — ИИ пока не нашёл проблем в диалогах
        </div>
      )}

      {pending.map(s => (
        <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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

          <div className="bg-red-50 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Предлагается добавить в базу знаний</p>
            <p className="text-sm text-[#1a1a1a]">{s.suggestion}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleReview(s.id, 'approve')}
              disabled={busyId === s.id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
            >
              <Icon name="Check" size={13} />
              Применить
            </button>
            <button
              onClick={() => handleReview(s.id, 'reject')}
              disabled={busyId === s.id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 disabled:opacity-60 transition-all"
            >
              <Icon name="X" size={13} />
              Отклонить
            </button>
          </div>
        </div>
      ))}

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
