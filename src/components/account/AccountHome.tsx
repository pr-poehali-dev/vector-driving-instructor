import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getDashboard, DashboardData } from '@/api/cabinet';
import type { AccountTab } from '@/pages/Account';

const STATUS_LABELS: Record<string, string> = {
  studying: 'Обучение активно',
  exam_ready: 'Готов к экзамену',
  finished: 'Завершил обучение',
  paused: 'Приостановлено',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function firstName(fullName: string): string {
  return fullName.trim().split(' ')[0] || fullName;
}

export default function AccountHome({ onNavigate, studentName }: { onNavigate: (tab: AccountTab) => void; studentName?: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-20 text-center text-gray-400">
      <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />
      Загрузка...
    </div>
  );

  if (error || !data) return (
    <div className="py-20 text-center text-gray-400 text-sm">{error || 'Не удалось загрузить данные'}</div>
  );

  const { student, pdd_progress, tests, mistakes_count, unread_notifications } = data;
  const name = firstName(student.name || studentName || '');

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-7 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #152a4a 0%, #0d1b2a 100%)' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            right: -60, bottom: -60, width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,0,45,0.25) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
        <div className="relative z-10 min-w-0">
          <h3 className="font-montserrat font-black text-xl md:text-2xl mb-1.5">Здравствуйте, {name}! 👋</h3>
          <p className="text-white/50 text-sm mb-4">Продолжайте обучение — вот что у вас в работе прямо сейчас.</p>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/15 text-green-300 border border-green-400/30">
              <Icon name="Activity" size={13} />
              {STATUS_LABELS[student.study_status] || student.study_status}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/15 backdrop-blur-sm">
              <Icon name="Car" size={13} />
              Категория «{student.study_category}»
            </span>
            {student.group_name && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/15 backdrop-blur-sm">
                <Icon name="Users" size={13} />
                Группа {student.group_name}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/15 backdrop-blur-sm">
              <Icon name="Calendar" size={13} />
              Старт: {fmtDate(student.study_start_date || student.created_at)}
            </span>
          </div>
        </div>
        <div className="relative z-10 text-center bg-white/[0.08] border border-white/15 rounded-xl px-6 py-4 min-w-[150px] flex-shrink-0">
          <div className="text-3xl font-black leading-none mb-1">{pdd_progress.percent}%</div>
          <div className="text-xs text-white/50 font-medium">Общий прогресс</div>
        </div>
      </div>

      {/* 3 Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#152a4a]">
              <Icon name="PlayCircle" size={17} className="text-[#E8002D]" />
              Продолжить учёбу
            </div>
            <span className="text-[11px] font-bold text-[#E8002D]">ПДД</span>
          </div>
          {pdd_progress.last_topic ? (
            <>
              <p className="text-sm font-semibold text-[#152a4a] mb-2 truncate">{pdd_progress.last_topic.title}</p>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${pdd_progress.percent}%`, background: 'linear-gradient(90deg, #E8002D, #fb7185)' }} />
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-400 mb-4">
                <span>Изучено тем: {pdd_progress.completed_topics}/{pdd_progress.total_topics}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 mb-4">Ещё не начато</p>
          )}
          <button onClick={() => onNavigate('pdd')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all" style={{ background: '#E8002D' }}>
            <Icon name="ArrowRight" size={13} />
            Продолжить
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#152a4a]">
              <Icon name="Map" size={17} className="text-[#457b9d]" />
              Маршрут Кургана
            </div>
            <span className="text-[11px] font-bold text-[#457b9d]">маршрут</span>
          </div>
          <p className="text-sm font-semibold text-[#152a4a] mb-2">Карта, видео и разбор точек</p>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1.5">
            <div className="h-full rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
          </div>
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-4">
            <span>Экзаменационный маршрут</span>
          </div>
          <button onClick={() => onNavigate('route')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-[#152a4a] text-xs font-semibold hover:bg-gray-50 transition-all">
            <Icon name="ExternalLink" size={13} />
            Открыть карту и видео
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#152a4a]">
              <Icon name="CheckCircle" size={17} className="text-green-500" />
              Тесты и результаты
            </div>
            <span className="text-[11px] font-bold text-green-600">{tests.avg_score_percent}% сдача</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Тестов пройдено:</span>
            <strong className="text-[#152a4a]">{tests.tests_done}</strong>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">Ошибок в базе:</span>
            <strong className={mistakes_count > 0 ? 'text-[#E8002D]' : 'text-green-600'}>{mistakes_count} вопросов</strong>
          </div>
          <button onClick={() => onNavigate('mistakes')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold transition-all"
            style={{ borderColor: '#fecdd3', color: '#E8002D' }}>
            <Icon name="RotateCcw" size={13} />
            Повторить ошибки
          </button>
        </div>
      </div>

      {/* 2-column: Tasks & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#152a4a]">
              <Icon name="ListTodo" size={17} />
              Ближайшие учебные задачи
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {pdd_progress.last_topic && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-[#152a4a]">
                    <Icon name="BookOpen" size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#152a4a] truncate">Продолжить тему «{pdd_progress.last_topic.title}»</p>
                    <p className="text-xs text-gray-400">{pdd_progress.last_topic.category_label}</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pdd')} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex-shrink-0" style={{ background: '#E8002D' }}>Начать</button>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-[#457b9d]">
                  <Icon name="MapPin" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#152a4a] truncate">Изучить экзаменационный маршрут</p>
                  <p className="text-xs text-gray-400">Карта, видео проезда и разбор точек</p>
                </div>
              </div>
              <button onClick={() => onNavigate('route')} className="px-3 py-1.5 rounded-lg border border-gray-200 text-[#152a4a] text-xs font-semibold flex-shrink-0">Смотреть</button>
            </div>
            {mistakes_count > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                    <Icon name="AlertTriangle" size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#152a4a] truncate">Повторить {mistakes_count} вопросов с ошибками</p>
                    <p className="text-xs text-gray-400">Работа над ошибками</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('mistakes')} className="px-3 py-1.5 rounded-lg border border-gray-200 text-[#152a4a] text-xs font-semibold flex-shrink-0">Решать</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#152a4a]">
              <Icon name="Bell" size={17} />
              Уведомления
            </div>
            <button onClick={() => onNavigate('notifications')} className="text-xs font-semibold text-[#E8002D]">Все →</button>
          </div>
          {unread_notifications > 0 ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <span className="w-2 h-2 rounded-full bg-[#E8002D] flex-shrink-0" />
              <p className="text-sm text-[#152a4a] font-medium">Новых сообщений: {unread_notifications}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Новых уведомлений нет</p>
          )}
        </div>
      </div>
    </div>
  );
}
