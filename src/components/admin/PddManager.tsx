import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import {
  PddCategory, PddTopic, PddQuestionAdmin,
  getAllCategories, saveCategory, deleteCategory,
  getAllTopicsAdmin, saveTopicAdmin, deleteTopicAdmin,
  getQuestionsAdmin, saveQuestionAdmin, deleteQuestionAdmin,
} from '@/api/pdd';

const ICONS = ['BookOpen', 'Signpost', 'Milestone', 'TrafficCone', 'Shuffle', 'PersonStanding', 'Car', 'Gauge', 'ParkingCircle', 'AlertTriangle', 'ShieldCheck', 'TrainFront'];

// ── Форма категории ─────────────────────────────────────────────────────────
function CategoryForm({ category, onClose, onSaved }: { category?: PddCategory | null; onClose: () => void; onSaved: (c: PddCategory) => void }) {
  const [label, setLabel] = useState(category?.label || '');
  const [icon, setIcon] = useState(category?.icon || 'BookOpen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await saveCategory({ id: category?.id, label, icon, sort_order: category?.sort_order || 0 });
      onSaved(data.category);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-montserrat font-bold text-base">{category ? 'Редактировать раздел' : 'Новый раздел ПДД'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Название</label>
            <input value={label} onChange={e => setLabel(e.target.value)} required placeholder="Дорожные знаки"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button type="button" key={ic} onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-[#E8002D] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  <Icon name={ic} size={16} fallback="BookOpen" />
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : category ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Форма темы ───────────────────────────────────────────────────────────────
function TopicForm({ categoryId, topic, onClose, onSaved }: {
  categoryId: number; topic?: PddTopic | null; onClose: () => void; onSaved: (t: PddTopic) => void;
}) {
  const [title, setTitle] = useState(topic?.title || '');
  const [content, setContent] = useState(topic?.content || '');
  const [imageUrl, setImageUrl] = useState(topic?.image_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await saveTopicAdmin({
        id: topic?.id, category_id: categoryId, title, content, image_url: imageUrl || undefined,
        sort_order: topic?.sort_order || 0,
      });
      onSaved(data.topic);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-montserrat font-bold text-base">{topic ? 'Редактировать тему' : 'Новая тема'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Заголовок темы</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Проезд перекрёстков"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Теоретический материал</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Текст, который увидит ученик перед тестом..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Изображение / схема (URL, необязательно)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : topic ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Форма вопроса ────────────────────────────────────────────────────────────
function QuestionForm({ topicId, categoryId, question, onClose, onSaved }: {
  topicId: number; categoryId: number; question?: PddQuestionAdmin | null; onClose: () => void; onSaved: (q: PddQuestionAdmin) => void;
}) {
  const [text, setText] = useState(question?.text || '');
  const [imageUrl, setImageUrl] = useState(question?.image_url || '');
  const [options, setOptions] = useState<string[]>(question?.options?.length ? question.options : ['', '']);
  const [correctIndex, setCorrectIndex] = useState(question?.correct_index ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (i: number, val: string) => setOptions(opts => opts.map((o, oi) => oi === i ? val : o));
  const addOption = () => setOptions(opts => [...opts, '']);
  const removeOption = (i: number) => {
    setOptions(opts => opts.filter((_, oi) => oi !== i));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) { setError('Нужно минимум 2 варианта ответа'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await saveQuestionAdmin({
        id: question?.id, topic_id: topicId, category_id: categoryId, text, image_url: imageUrl || undefined,
        options: cleanOptions, correct_index: Math.min(correctIndex, cleanOptions.length - 1),
        explanation, difficulty: question?.difficulty || 1, sort_order: question?.sort_order || 0,
      });
      onSaved(data.question);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-montserrat font-bold text-base">{question ? 'Редактировать вопрос' : 'Новый вопрос'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Текст вопроса</label>
            <textarea value={text} onChange={e => setText(e.target.value)} required rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Изображение (URL, необязательно)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Варианты ответа</label>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setCorrectIndex(i)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${correctIndex === i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                    title="Отметить как правильный">
                    <Icon name="Check" size={13} />
                  </button>
                  <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Вариант ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0">
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOption} className="mt-2 text-xs text-[#E8002D] font-semibold flex items-center gap-1 hover:underline">
              <Icon name="Plus" size={12} />
              Добавить вариант
            </button>
            <p className="text-xs text-gray-400 mt-1">Нажмите на кружок слева, чтобы отметить правильный ответ</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Объяснение (необязательно)</label>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} placeholder="Почему именно этот ответ правильный..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : question ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Level = { view: 'categories' } | { view: 'topics'; category: PddCategory } | { view: 'questions'; topic: PddTopic; categoryId: number };

export default function PddManager() {
  const [categories, setCategories] = useState<PddCategory[]>([]);
  const [topics, setTopics] = useState<PddTopic[]>([]);
  const [questions, setQuestions] = useState<PddQuestionAdmin[]>([]);
  const [level, setLevel] = useState<Level>({ view: 'categories' });
  const [loading, setLoading] = useState(true);

  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<PddCategory | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editTopic, setEditTopic] = useState<PddTopic | null>(null);
  const [showQForm, setShowQForm] = useState(false);
  const [editQ, setEditQ] = useState<PddQuestionAdmin | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number; label: string } | null>(null);

  useEffect(() => {
    getAllCategories().then(d => setCategories(d.categories)).finally(() => setLoading(false));
  }, []);

  const openTopics = (cat: PddCategory) => {
    setLevel({ view: 'topics', category: cat });
    setLoading(true);
    getAllTopicsAdmin(cat.id).then(d => setTopics(d.topics)).finally(() => setLoading(false));
  };

  const openQuestions = (topic: PddTopic, categoryId: number) => {
    setLevel({ view: 'questions', topic, categoryId });
    setLoading(true);
    getQuestionsAdmin({ topic_id: topic.id }).then(d => setQuestions(d.questions)).finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'category') {
      await deleteCategory(confirmDelete.id);
      setCategories(prev => prev.filter(c => c.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'topic') {
      await deleteTopicAdmin(confirmDelete.id);
      setTopics(prev => prev.filter(t => t.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'question') {
      await deleteQuestionAdmin(confirmDelete.id);
      setQuestions(prev => prev.filter(q => q.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <button onClick={() => setLevel({ view: 'categories' })} className={`font-semibold ${level.view === 'categories' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'}`}>
          Разделы ПДД
        </button>
        {level.view !== 'categories' && (
          <>
            <Icon name="ChevronRight" size={14} className="text-gray-300" />
            <button onClick={() => openTopics(level.view === 'topics' ? level.category : categories.find(c => c.id === level.categoryId) as PddCategory)}
              className={`font-semibold ${level.view === 'topics' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'}`}>
              {level.view === 'topics' ? level.category.label : categories.find(c => c.id === level.categoryId)?.label}
            </button>
          </>
        )}
        {level.view === 'questions' && (
          <>
            <Icon name="ChevronRight" size={14} className="text-gray-300" />
            <span className="font-semibold text-[#1a1a1a] truncate">{level.topic.title}</span>
          </>
        )}
      </div>

      {level.view === 'categories' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Разделы, которые видит ученик в кабинете</p>
            <button onClick={() => { setEditCat(null); setShowCatForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
              <Icon name="Plus" size={15} />
              Добавить раздел
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div> : (
            <div className="flex flex-col gap-2.5">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <button onClick={() => openTopics(cat)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Icon name={cat.icon} size={16} className="text-[#E8002D]" fallback="BookOpen" />
                    </div>
                    <span className="text-sm font-semibold text-[#1a1a1a] truncate">{cat.label}</span>
                  </button>
                  <button onClick={() => { setEditCat(cat); setShowCatForm(true); }} className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete({ type: 'category', id: cat.id, label: cat.label })} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Icon name="Trash2" size={14} />
                  </button>
                  <button onClick={() => openTopics(cat)} className="p-2 text-gray-300"><Icon name="ChevronRight" size={16} /></button>
                </div>
              ))}
              {categories.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Разделов пока нет</div>}
            </div>
          )}
        </>
      )}

      {level.view === 'topics' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Учебные темы внутри раздела</p>
            <button onClick={() => { setEditTopic(null); setShowTopicForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
              <Icon name="Plus" size={15} />
              Добавить тему
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div> : (
            <div className="flex flex-col gap-2.5">
              {topics.map(t => (
                <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <button onClick={() => openQuestions(t, level.category.id)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{t.title}</p>
                  </button>
                  <button onClick={() => { setEditTopic(t); setShowTopicForm(true); }} className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete({ type: 'topic', id: t.id, label: t.title })} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Icon name="Trash2" size={14} />
                  </button>
                  <button onClick={() => openQuestions(t, level.category.id)} className="p-2 text-gray-300"><Icon name="ChevronRight" size={16} /></button>
                </div>
              ))}
              {topics.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Тем пока нет</div>}
            </div>
          )}
        </>
      )}

      {level.view === 'questions' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Вопросы теста по теме «{level.topic.title}»</p>
            <button onClick={() => { setEditQ(null); setShowQForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
              <Icon name="Plus" size={15} />
              Добавить вопрос
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div> : (
            <div className="flex flex-col gap-2.5">
              {questions.map(q => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <p className="text-sm font-medium text-[#1a1a1a] flex-1">{q.text}</p>
                    <button onClick={() => { setEditQ(q); setShowQForm(true); }} className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50 flex-shrink-0">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete({ type: 'question', id: q.id, label: q.text })} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-lg ${i === q.correct_index ? 'bg-green-50 text-green-700 font-semibold' : 'bg-gray-50 text-gray-400'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {questions.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Вопросов пока нет</div>}
            </div>
          )}
        </>
      )}

      {showCatForm && <CategoryForm category={editCat} onClose={() => setShowCatForm(false)} onSaved={c => setCategories(prev => {
        const idx = prev.findIndex(x => x.id === c.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
        return [...prev, c];
      })} />}

      {showTopicForm && level.view === 'topics' && (
        <TopicForm categoryId={level.category.id} topic={editTopic} onClose={() => setShowTopicForm(false)} onSaved={t => setTopics(prev => {
          const idx = prev.findIndex(x => x.id === t.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = t; return next; }
          return [...prev, t];
        })} />
      )}

      {showQForm && level.view === 'questions' && (
        <QuestionForm topicId={level.topic.id} categoryId={level.categoryId} question={editQ} onClose={() => setShowQForm(false)} onSaved={q => setQuestions(prev => {
          const idx = prev.findIndex(x => x.id === q.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = q; return next; }
          return [...prev, q];
        })} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Icon name="Trash2" size={18} className="text-red-500" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2">Удалить?</h3>
            <p className="text-sm text-gray-500 mb-5 truncate">«{confirmDelete.label}» будет удалено.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
