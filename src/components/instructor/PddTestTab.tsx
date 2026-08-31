import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { startPddTest, submitPddTest, PddQuestion, PddAnswerResult } from '@/api/instructor';

const TEST_DURATION_SEC = 20 * 60;

type Stage = 'intro' | 'running' | 'result';

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PddTestTab() {
  const [stage, setStage] = useState<Stage>('intro');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<PddQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SEC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ correct_count: number; total_questions: number; passed: boolean; results: PddAnswerResult[] } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(async (finalAnswers: Record<number, number>) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const payload = Object.entries(finalAnswers).map(([qid, idx]) => ({ question_id: Number(qid), selected_index: idx }));
      const data = await submitPddTest(sessionId, payload);
      setResult(data);
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (stage !== 'running') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finish(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await startPddTest();
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setAnswers({});
      setCurrent(0);
      setTimeLeft(TEST_DURATION_SEC);
      setStage('running');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запуска теста');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qid: number, idx: number) => {
    setAnswers(prev => ({ ...prev, [qid]: idx }));
  };

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  if (stage === 'intro') {
    return (
      <div className="max-w-lg mx-auto py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-600/15 flex items-center justify-center mx-auto mb-5">
          <Icon name="FileCheck2" size={30} className="text-rose-500" />
        </div>
        <h3 className="text-white font-montserrat font-bold text-xl mb-2">Ежемесячный зачёт по ПДД</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          20 случайных вопросов из официального банка ПДД РФ. Время на прохождение — 20 минут.
          Результат мгновенно фиксируется в ваших показателях KPI (+20 баллов при сдаче от 90%).
        </p>
        {error && <div className="mb-4 flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm"><Icon name="AlertCircle" size={14} />{error}</div>}
        <button
          onClick={start}
          disabled={loading}
          className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-montserrat font-bold text-sm transition-colors disabled:opacity-60"
        >
          {loading ? 'Загрузка...' : 'Начать тестирование'}
        </button>
      </div>
    );
  }

  if (stage === 'running' && q) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm font-semibold">Вопрос {current + 1} из {questions.length}</span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${timeLeft < 60 ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
            <Icon name="Timer" size={14} />
            {fmtTime(timeLeft)}
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-rose-600 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          {q.image_url && <img src={q.image_url} alt="" className="w-full max-h-56 object-contain rounded-xl mb-4 bg-white" />}
          <p className="text-white font-montserrat font-semibold text-base mb-5">{q.text}</p>
          <div className="flex flex-col gap-2.5">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(q.id, idx)}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  answers[q.id] === idx
                    ? 'bg-rose-600/15 border-rose-600 text-white'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            Назад
          </button>
          <span className="text-slate-500 text-xs">Отвечено: {answeredCount} / {questions.length}</span>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={() => finish(answers)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Отправка...' : 'Завершить тест'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'result' && result) {
    const percent = Math.round((result.correct_count / result.total_questions) * 100);
    return (
      <div className="max-w-lg mx-auto py-8 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${result.passed ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
          <Icon name={result.passed ? 'CheckCircle2' : 'XCircle'} size={38} className={result.passed ? 'text-emerald-500' : 'text-red-500'} />
        </div>
        <h3 className="text-white font-montserrat font-bold text-2xl mb-1">{result.passed ? 'Зачёт сдан!' : 'Зачёт не сдан'}</h3>
        <p className="text-slate-400 text-sm mb-6">
          Правильных ответов: {result.correct_count} из {result.total_questions} ({percent}%)
          {result.passed && ' · +20 баллов начислено в KPI'}
        </p>
        <button
          onClick={() => setStage('intro')}
          className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-white text-sm font-semibold transition-colors"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  return null;
}
