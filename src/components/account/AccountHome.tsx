import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getDashboard, DashboardData } from '@/api/cabinet';
import type { AccountTab } from '@/pages/Account';

const STATUS_LABELS: Record<string, string> = {
  studying: 'Обучается',
  exam_ready: 'Готов к экзамену',
  finished: 'Завершил обучение',
  paused: 'Приостановлено',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AccountHome({ onNavigate }: { onNavigate: (tab: AccountTab) => void }) {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Карточка ученика */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: '#E8002D' }}>
            {student.name[0]}
          </div>
          <div className="flex-1 min-w-[180px]">
            <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">{student.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
              <span>Категория {student.study_category}</span>
              {student.group_name && <span>Группа {student.group_name}</span>}
              <span>С {fmtDate(student.study_start_date || student.created_at)}</span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 whitespace-nowrap">
            {STATUS_LABELS[student.study_status] || student.study_status}
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Общий прогресс ПДД</span>
            <span className="text-sm font-bold text-[#1a1a1a]">{pdd_progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pdd_progress.percent}%`, background: '#E8002D' }} />
          </div>
        </div>
      </div>

      {/* Продолжить обучение */}
      {pdd_progress.last_topic && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Продолжить обучение</p>
            <p className="font-montserrat font-bold text-[#1a1a1a]">{pdd_progress.last_topic.category_label} — {pdd_progress.last_topic.title}</p>
          </div>
          <button
            onClick={() => onNavigate('pdd')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all whitespace-nowrap"
            style={{ background: '#E8002D' }}
          >
            Продолжить
            <Icon name="ArrowRight" size={15} />
          </button>
        </div>
      )}

      {/* Блоки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => onNavigate('pdd')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Icon name="BookOpen" size={18} className="text-[#E8002D]" />
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </div>
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">ПДД</p>
          <p className="text-xs text-gray-400">Изучено тем: {pdd_progress.completed_topics} из {pdd_progress.total_topics}</p>
        </button>

        <button onClick={() => onNavigate('route')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Icon name="Map" size={18} className="text-violet-600" />
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </div>
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">Экзаменационный маршрут</p>
          <p className="text-xs text-gray-400">Карта, видео проезда и разбор каждой точки</p>
        </button>

        <button onClick={() => onNavigate('results')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Icon name="ClipboardList" size={18} className="text-blue-600" />
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </div>
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">Тесты пройдено: {tests.tests_done}</p>
          <p className="text-xs text-gray-400">
            Средний результат: {tests.avg_score_percent}%
            {tests.last_result && ` · последний: ${tests.last_result.correct_count}/${tests.last_result.total_questions}`}
          </p>
        </button>

        <button onClick={() => onNavigate('mistakes')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Icon name="AlertTriangle" size={18} className="text-amber-500" />
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </div>
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">Работа над ошибками</p>
          <p className="text-xs text-gray-400">{mistakes_count > 0 ? `Вопросов для повторения: ${mistakes_count}` : 'Ошибок пока нет'}</p>
        </button>

        <button onClick={() => onNavigate('notifications')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Icon name="Bell" size={18} className="text-purple-600" />
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </div>
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">Уведомления</p>
          <p className="text-xs text-gray-400">{unread_notifications > 0 ? `Новых: ${unread_notifications}` : 'Новых нет'}</p>
        </button>
      </div>
    </div>
  );
}