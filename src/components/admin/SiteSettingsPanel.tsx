import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getSiteSettings, saveSiteSettings, SiteSettings } from '@/api/siteSettings';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-[#16a34a]' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </div>
  );
}

export default function SiteSettingsPanel() {
  const [settings, setSettings] = useState<SiteSettings>({
    chat_topics_enabled: true,
    chat_ai_enabled: true,
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSiteSettings()
      .then(s => { setSettings(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const update = async (patch: Partial<SiteSettings>) => {
    const prev = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = await saveSiteSettings(patch);
      setSettings(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setSettings(prev);
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

  const bothOff = !settings.chat_topics_enabled && !settings.chat_ai_enabled;

  return (
    <div className="flex flex-col gap-6">

      {/* Чат-боты */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="MessageSquare" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Чат-боты на сайте</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Управляй доступностью ботов для учеников — на главной странице и в личном кабинете</p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon name="BookOpen" size={15} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">Бот с темами</p>
                <p className="text-xs text-gray-400">Готовые уроки: парковка, манёвры, ПДД</p>
              </div>
            </div>
            <Toggle checked={settings.chat_topics_enabled} onChange={() => update({ chat_topics_enabled: !settings.chat_topics_enabled })} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Icon name="Sparkles" size={15} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">AI-инструктор</p>
                <p className="text-xs text-gray-400">Отвечает на любые вопросы учеников</p>
              </div>
            </div>
            <Toggle checked={settings.chat_ai_enabled} onChange={() => update({ chat_ai_enabled: !settings.chat_ai_enabled })} />
          </div>
        </div>

        {bothOff && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-xs">
            <Icon name="AlertTriangle" size={14} />
            Оба бота выключены — ученики увидят сообщение «Чат временно недоступен»
          </div>
        )}
      </div>

      {/* Технические работы */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Construction" size={16} className="text-[#E8002D]" />
          <h3 className="font-montserrat font-bold text-sm text-[#1a1a1a]">Технические работы</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Включи на время обновлений — посетители увидят страницу «Технические работы» вместо сайта.
          Кабинет администратора останется доступен.
        </p>

        <div className={`flex items-center justify-between p-4 rounded-xl border ${settings.maintenance_mode ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${settings.maintenance_mode ? 'bg-red-100' : 'bg-gray-100'}`}>
              <Icon name="Cone" size={15} className={settings.maintenance_mode ? 'text-red-500' : 'text-gray-500'} fallback="Construction" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">Режим техработ</p>
              <p className="text-xs text-gray-400">{settings.maintenance_mode ? 'Сайт закрыт для посетителей' : 'Сайт работает в обычном режиме'}</p>
            </div>
          </div>
          <Toggle checked={settings.maintenance_mode} onChange={() => update({ maintenance_mode: !settings.maintenance_mode })} />
        </div>
      </div>

      <div className="flex items-center gap-3 h-5">
        {saving && (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Icon name="Loader" size={14} className="animate-spin" />
            Сохранение...
          </div>
        )}
        {saved && !saving && (
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
