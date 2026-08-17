import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { startTest, submitTest, TestQuestion, TestAnswerResult } from '@/api/pdd';

interface Props {
  testType: 'topic' | 'category' | 'random' | 'mistakes';
  topicId?: number;
  categoryId?: number;
  count?: number;
  title: string;
  onClose: () => void;
  onFinished?: () => void;
}

type Phase = 'loading' | 'running' | 'error' | 'finished';

export default function PddTest({ testType, topicId, categoryId, count, title, onClose, onFinished }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ total: number; correct_count: number; passed: boolean; results: TestAnswerResult[] } | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  useEffect(() => {
    startTest({ test_type: testType, topic_id: topicId, category_id: categoryId, count })
      .then(data => {
        setSessionId(data.session_id);
        setQuestions(data.questions);
        setPhase(data.questions.length ? 'running' : 'error');
        if (!data.questions.length) setError('Вопросов не найдено');
      })
      .catch(e => { setError(e instanceof Error ? e.message : 'Ошибка запуска теста'); setPhase('error'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[current];
  const selected = q ? answers[q.id] : undefined;

  const selectAnswer = (index: number) => {
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: index }));
  };

  const goNext = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1);
    else handleFinish();
  };
  const goPrev = () => { if (current > 0) setCurrent(c => c - 1); };

  const handleFinish = async () => {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = questions.map(qq => ({ question_id: qq.id, selected_index: answers[qq.id] ?? null }));
      const data = await submitTest(sessionId, payload);
      setResult(data);
      setPhase('finished');
      onFinished?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки результата');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="font-montserrat font-bold text-sm sm:text-base text-[#1a1a1a] truncate">{title}</h3>
          {phase === 'running' && <p className="text-xs text-gray-400 mt-0.5">Вопрос {current + 1} из {questions.length}</p>}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 flex-shrink-0"><Icon name="X" size={20} /></button>
      </div>

      {phase === 'loading' && (
        <div className="flex-1 flex items-center justify-center">
          <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
        </div>
      )}

      {phase === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="AlertCircle" size={32} className="text-red-400" />
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Закрыть</button>
        </div>
      )}

      {phase === 'running' && q && (
        <>
          <div className="px-4 sm:px-6 pt-2 flex-shrink-0">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#E8002D] transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-xl mx-auto">
              <p className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-4">{q.text}</p>
              {q.image_url && (
                <img src={q.image_url} alt="" className="w-full rounded-xl mb-4 border border-gray-100" />
              )}
              <div className="flex flex-col gap-2.5">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                      selected === i ? 'border-[#E8002D] bg-red-50 text-[#1a1a1a]' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selected === i ? 'bg-[#E8002D] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {String.fromCharCode(1040 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={goPrev}
              disabled={current === 0}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-all"
            >
              Назад
            </button>
            <button
              onClick={goNext}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: '#E8002D' }}
            >
              {submitting ? <Icon name="Loader" size={15} className="animate-spin" /> : null}
              {current < questions.length - 1 ? 'Далее' : 'Завершить'}
            </button>
          </div>
          {error && <p className="text-center text-xs text-red-500 pb-2">{error}</p>}
        </>
      )}

      {phase === 'finished' && result && reviewIndex === null && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
              <Icon name={result.passed ? 'CheckCircle2' : 'XCircle'} size={36} className={result.passed ? 'text-green-500' : 'text-red-400'} />
            </div>
            <h3 className="font-montserrat font-black text-2xl text-[#1a1a1a] mb-1">{result.correct_count}/{result.total}</h3>
            <p className={`text-sm font-semibold mb-6 ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
              {result.passed ? 'Тест пройден' : 'Тест не пройден'}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {result.results.map((r, i) => (
                <button
                  key={r.question_id}
                  onClick={() => setReviewIndex(i)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    r.is_correct ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'
                  }`}
                >
                  <Icon name={r.is_correct ? 'Check' : 'X'} size={15} className={r.is_correct ? 'text-green-500' : 'text-red-400'} />
                  <span className="text-xs text-gray-600 truncate flex-1">{r.text}</span>
                  <Icon name="ChevronRight" size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>

            <button onClick={onClose} className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all" style={{ background: '#E8002D' }}>
              Завершить
            </button>
          </div>
        </div>
      )}

      {phase === 'finished' && result && reviewIndex !== null && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-xl mx-auto">
            <button onClick={() => setReviewIndex(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
              <Icon name="ArrowLeft" size={15} />
              Ко всем вопросам
            </button>
            {(() => {
              const r = result.results[reviewIndex];
              return (
                <>
                  <p className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-4">{r.text}</p>
                  {r.image_url && <img src={r.image_url} alt="" className="w-full rounded-xl mb-4 border border-gray-100" />}
                  <div className="flex flex-col gap-2.5 mb-4">
                    {r.options.map((opt, i) => {
                      const isCorrect = i === r.correct_index;
                      const isSelected = i === r.selected_index;
                      return (
                        <div
                          key={i}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-3 ${
                            isCorrect ? 'border-green-300 bg-green-50' : isSelected ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isCorrect ? 'bg-green-500 text-white' : isSelected ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {String.fromCharCode(1040 + i)}
                          </span>
                          {opt}
                          {isCorrect && <Icon name="Check" size={15} className="text-green-500 ml-auto" />}
                          {isSelected && !isCorrect && <Icon name="X" size={15} className="text-red-400 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                  {r.explanation && (
                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Объяснение</p>
                      {r.explanation}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}