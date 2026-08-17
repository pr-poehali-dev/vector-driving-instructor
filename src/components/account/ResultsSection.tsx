import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getResults, getResultDetail, TestResultSummary, TestAnswerResult } from '@/api/pdd';

const TYPE_LABELS: Record<string, string> = {
  topic: 'Тест по теме',
  category: 'Тест по разделу',
  random: '20 случайных вопросов',
  mistakes: 'Работа над ошибками',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function DetailView({ sessionId, onBack }: { sessionId: number; onBack: () => void }) {
  const [answers, setAnswers] = useState<TestAnswerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResultDetail(sessionId).then(d => setAnswers(d.answers)).finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 w-fit">
        <Icon name="ArrowLeft" size={15} />
        К истории результатов
      </button>
      {loading ? (
        <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {answers.map((r, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm border p-5 ${r.is_correct ? 'border-gray-100' : 'border-red-100'}`}>
              <div className="flex items-start gap-2 mb-3">
                <Icon name={r.is_correct ? 'CheckCircle2' : 'XCircle'} size={17} className={r.is_correct ? 'text-green-500 mt-0.5' : 'text-red-400 mt-0.5'} />
                <p className="text-sm font-semibold text-[#1a1a1a]">{r.text}</p>
              </div>
              <div className="flex flex-col gap-1.5 mb-2">
                {r.options.map((opt, oi) => {
                  const isCorrect = oi === r.correct_index;
                  const isSelected = oi === r.selected_index;
                  return (
                    <div key={oi} className={`text-xs px-3 py-2 rounded-lg ${
                      isCorrect ? 'bg-green-50 text-green-700 font-semibold' : isSelected ? 'bg-red-50 text-red-500' : 'text-gray-400'
                    }`}>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {r.explanation && <p className="text-xs text-gray-400 mt-2">{r.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsSection() {
  const [results, setResults] = useState<TestResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    getResults().then(d => setResults(d.results)).finally(() => setLoading(false));
  }, []);

  if (detailId !== null) return <DetailView sessionId={detailId} onBack={() => setDetailId(null)} />;

  if (loading) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-1">Мои результаты</h2>
      {results.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="ClipboardList" size={28} className="mx-auto mb-2 text-gray-200" />
          Вы ещё не проходили тесты
        </div>
      ) : (
        results.map(r => (
          <button
            key={r.id}
            onClick={() => setDetailId(r.id)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-gray-200 transition-all flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-montserrat font-bold text-xs ${
              r.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {r.correct_count}/{r.total_questions}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                {r.topic_title || r.category_label || TYPE_LABELS[r.test_type] || 'Тест'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.finished_at)} · {TYPE_LABELS[r.test_type] || r.test_type}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
              r.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {r.passed ? 'Пройден' : 'Не пройден'}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
