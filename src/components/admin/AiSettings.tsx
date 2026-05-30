import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getAiSettings, saveAiSettings, AiSettings } from '@/api/ai';

const STYLE_OPTIONS = [
  { value: 'friendly', label: 'Дружелюбный', desc: 'Тёплый, поддерживающий тон' },
  { value: 'strict', label: 'Строгий', desc: 'Официальный, чёткий тон' },
  { value: 'motivating', label: 'Мотивирующий', desc: 'Энергичный, вдохновляющий' },
];

export default function AiSettingsEditor() {
  const [settings, setSettings] = useState<AiSettings>({
    system_prompt: '',
    welcome_message: '',
    forbidden_topics: '',
    temperature: 0.7,
    style: 'friendly',
    extra_sources: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAiSettings()
      .then(s => { setSettings(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await saveAiSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="py-16 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка настроек...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Системный промпт */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Brain" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Системный промпт</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">Инструкции для AI — как отвечать, что говорить, тон общения</p>
        <textarea
          value={settings.system_prompt}
          onChange={e => setSettings(s => ({ ...s, system_prompt: e.target.value }))}
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors font-mono"
        />
      </div>

      {/* Приветственное сообщение */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="MessageCircle" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Приветственное сообщение</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">Что AI пишет ученику при открытии чата</p>
        <textarea
          value={settings.welcome_message}
          onChange={e => setSettings(s => ({ ...s, welcome_message: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors"
        />
      </div>

      {/* Стиль и температура */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Sliders" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Стиль и температура</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Тон общения и креативность ответов</p>

        <div className="flex gap-2 mb-5">
          {STYLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, style: opt.value }))}
              className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                settings.style === opt.value
                  ? 'border-[#E8002D] bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xs font-semibold mb-0.5 ${settings.style === opt.value ? 'text-[#E8002D]' : 'text-gray-700'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-400">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Температура (креативность)
            </label>
            <span className="text-sm font-bold text-[#1a1a1a]">{settings.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.temperature}
            onChange={e => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-[#E8002D]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Точный (0.0)</span>
            <span>Сбалансированный (0.5)</span>
            <span>Творческий (1.0)</span>
          </div>
        </div>
      </div>

      {/* Запрещённые темы */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Ban" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Запрещённые темы</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">Перечисли темы на которые AI не будет отвечать (каждая с новой строки)</p>
        <textarea
          value={settings.forbidden_topics}
          onChange={e => setSettings(s => ({ ...s, forbidden_topics: e.target.value }))}
          rows={4}
          placeholder={'политика\nрелигия\nличные данные учеников'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors"
        />
      </div>

      {/* Дополнительные источники */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="BookOpen" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Дополнительные знания</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Вставь сюда любые тексты, правила, инструкции или ссылки на сайты — AI будет использовать эти знания в ответах.
          Например: расписание занятий, цены, адрес автошколы, особые правила.
        </p>
        <textarea
          value={settings.extra_sources}
          onChange={e => setSettings(s => ({ ...s, extra_sources: e.target.value }))}
          rows={6}
          placeholder={'Автошкола Вектор, г. Курган, ул. Примерная 1\nТелефон: +7 (xxx) xxx-xx-xx\nЦена обучения: 35 000 руб.\nРасписание: пн-пт 9:00-18:00\n\nДополнительные правила и инструкции...'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors"
        />
      </div>

      {/* Кнопка сохранения */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ background: '#E8002D' }}
        >
          <Icon name={saving ? 'Loader' : 'Save'} size={15} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-fade-in">
            <Icon name="CheckCircle" size={15} />
            Сохранено!
          </div>
        )}
        {error && (
          <div className="flex items-center gap-1.5 text-red-500 text-sm">
            <Icon name="AlertCircle" size={15} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
