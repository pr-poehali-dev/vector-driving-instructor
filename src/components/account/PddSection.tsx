import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getCategories, getTopics, getTopic, PddCategory, PddTopic } from '@/api/pdd';
import PddTest from './PddTest';

type View = { level: 'categories' } | { level: 'topics'; category: PddCategory } | { level: 'topic'; topic: PddTopic; categoryLabel: string };

const STATUS_ICON: Record<string, { icon: string; color: string }> = {
  completed: { icon: 'CheckCircle2', color: 'text-green-500' },
  in_progress: { icon: 'Clock', color: 'text-amber-500' },
  not_started: { icon: 'Circle', color: 'text-gray-300' },
};

export default function PddSection() {
  const [categories, setCategories] = useState<PddCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ level: 'categories' });
  const [topics, setTopics] = useState<PddTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [testConfig, setTestConfig] = useState<{ topicId: number; title: string } | null>(null);

  useEffect(() => {
    getCategories().then(d => setCategories(d.categories)).finally(() => setLoading(false));
  }, []);

  const openCategory = (cat: PddCategory) => {
    setView({ level: 'topics', category: cat });
    setTopicsLoading(true);
    getTopics(cat.id).then(d => setTopics(d.topics)).finally(() => setTopicsLoading(false));
  };

  const openTopic = async (topic: PddTopic, categoryLabel: string) => {
    const d = await getTopic(topic.id);
    setView({ level: 'topic', topic: { ...d.topic, status: topic.status }, categoryLabel });
  };

  if (loading) return (
    <div className="py-20 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка...
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <button onClick={() => setView({ level: 'categories' })} className={`font-semibold ${view.level === 'categories' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'}`}>
          ПДД
        </button>
        {view.level !== 'categories' && (
          <>
            <Icon name="ChevronRight" size={14} className="text-gray-300" />
            <button onClick={() => openCategory(view.level === 'topics' ? view.category : { id: view.topic.category_id, label: view.categoryLabel } as PddCategory)}
              className={`font-semibold ${view.level === 'topics' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'}`}>
              {view.level === 'topics' ? view.category.label : view.categoryLabel}
            </button>
          </>
        )}
        {view.level === 'topic' && (
          <>
            <Icon name="ChevronRight" size={14} className="text-gray-300" />
            <span className="font-semibold text-[#1a1a1a] truncate">{view.topic.title}</span>
          </>
        )}
      </div>

      {view.level === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => openCategory(cat)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Icon name={cat.icon} size={20} className="text-[#E8002D]" fallback="BookOpen" />
              </div>
              <span className="font-montserrat font-bold text-sm text-[#1a1a1a] flex-1">{cat.label}</span>
              <Icon name="ChevronRight" size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
          {categories.length === 0 && (
            <div className="col-span-2 py-16 text-center text-gray-400 text-sm">Разделы ПДД пока не добавлены</div>
          )}
        </div>
      )}

      {view.level === 'topics' && (
        <>
          {topicsLoading ? (
            <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topics.map(t => {
                const st = STATUS_ICON[t.status || 'not_started'];
                return (
                  <button
                    key={t.id}
                    onClick={() => openTopic(t, view.category.label)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-gray-200 transition-all flex items-center gap-3"
                  >
                    <Icon name={st.icon} size={18} className={`${st.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{t.title}</p>
                      {t.status === 'completed' && <p className="text-xs text-gray-400 mt-0.5">Результат: {t.best_score_percent}%</p>}
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
              {topics.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Темы пока не добавлены</div>}
            </div>
          )}
        </>
      )}

      {view.level === 'topic' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-7">
          <h2 className="font-montserrat font-bold text-xl text-[#1a1a1a] mb-4">{view.topic.title}</h2>
          {view.topic.image_url && (
            <img src={view.topic.image_url} alt="" className="w-full rounded-xl mb-4 border border-gray-100" />
          )}
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
            {view.topic.content || 'Материал по этой теме скоро появится.'}
          </div>
          {(view.topic.question_count || 0) > 0 && (
            <button
              onClick={() => setTestConfig({ topicId: view.topic.id, title: `Тест: ${view.topic.title}` })}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all"
              style={{ background: '#E8002D' }}
            >
              <Icon name="PenLine" size={16} />
              Пройти тест ({view.topic.question_count} вопросов)
            </button>
          )}
        </div>
      )}

      {testConfig && (
        <PddTest
          testType="topic"
          topicId={testConfig.topicId}
          title={testConfig.title}
          onClose={() => setTestConfig(null)}
          onFinished={() => {
            if (view.level === 'topics') openCategory(view.category);
          }}
        />
      )}
    </div>
  );
}
