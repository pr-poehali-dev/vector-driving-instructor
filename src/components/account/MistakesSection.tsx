import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getMistakes } from '@/api/pdd';
import PddTest from './PddTest';

interface MistakeItem {
  question_id: number;
  times_wrong: number;
  last_wrong_at: string;
  text: string;
  image_url: string | null;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function MistakesSection() {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTest, setShowTest] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getMistakes().then(d => setMistakes(d.mistakes)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Работа над ошибками</h2>
        {mistakes.length > 0 && (
          <button
            onClick={() => setShowTest(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: '#E8002D' }}
          >
            <Icon name="RefreshCw" size={15} />
            Повторить ошибки ({mistakes.length})
          </button>
        )}
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="CheckCircle2" size={28} className="mx-auto mb-2 text-green-400" />
          Ошибок нет — отличная работа!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {mistakes.map(m => (
            <div key={m.question_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === m.question_id ? null : m.question_id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600 text-xs font-bold">
                  {m.times_wrong}×
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] flex-1 truncate">{m.text}</p>
                <Icon name={expanded === m.question_id ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-300 flex-shrink-0" />
              </button>
              {expanded === m.question_id && (
                <div className="px-4 pb-4">
                  {m.image_url && <img src={m.image_url} alt="" className="w-full rounded-xl mb-3 border border-gray-100" />}
                  <div className="flex flex-col gap-1.5 mb-2">
                    {m.options.map((opt, i) => (
                      <div key={i} className={`text-xs px-3 py-2 rounded-lg ${i === m.correct_index ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-400'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  {m.explanation && <p className="text-xs text-gray-400">{m.explanation}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTest && (
        <PddTest
          testType="mistakes"
          title="Работа над ошибками"
          onClose={() => setShowTest(false)}
          onFinished={load}
        />
      )}
    </div>
  );
}
