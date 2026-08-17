import Icon from '@/components/ui/icon';
import { RoutePoint, POINT_TYPE_LABELS, POINT_TYPE_ICONS } from '@/api/route';
import RouteVideoPlayer from './RouteVideoPlayer';

const DIFFICULTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'Простой', color: 'text-green-600', bg: 'bg-green-50' },
  normal: { label: 'Средний', color: 'text-amber-600', bg: 'bg-amber-50' },
  hard: { label: 'Сложный', color: 'text-red-600', bg: 'bg-red-50' },
};

interface Props {
  point: RoutePoint;
  onMarkStudied?: () => void;
  marking?: boolean;
}

export default function RoutePointCard({ point, onMarkStudied, marking }: Props) {
  const diff = DIFFICULTY_LABELS[point.difficulty] || DIFFICULTY_LABELS.normal;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Icon name={POINT_TYPE_ICONS[point.point_type]} size={18} className="text-[#E8002D]" fallback="MapPin" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-semibold">Точка №{point.point_number}</p>
            <h3 className="font-montserrat font-bold text-[#1a1a1a] truncate">{point.title}</h3>
          </div>
        </div>
        {point.studied && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            <Icon name="Check" size={12} />
            Изучено
          </span>
        )}
      </div>

      {point.video_url && (
        <RouteVideoPlayer url={point.video_url} title={point.video_title || point.title} thumb={point.video_thumb} />
      )}

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
          {POINT_TYPE_LABELS[point.point_type]}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff.color} ${diff.bg}`}>
          {diff.label}
        </span>
      </div>

      {point.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{point.description}</p>
      )}

      {point.action_steps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Порядок выполнения</p>
          <ol className="flex flex-col gap-1.5">
            {point.action_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {point.common_mistakes?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Icon name="AlertTriangle" size={13} />
            Типичные ошибки
          </p>
          <ul className="flex flex-col gap-1.5">
            {point.common_mistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Icon name="X" size={13} className="text-red-400 flex-shrink-0 mt-1" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {point.pdd_refs?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Icon name="BookOpen" size={13} />
            ПДД
          </p>
          <div className="flex flex-wrap gap-1.5">
            {point.pdd_refs.map((r, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{r}</span>
            ))}
          </div>
        </div>
      )}

      {point.scheme_image_url && (
        <img src={point.scheme_image_url} alt="Схема манёвра" className="w-full rounded-xl border border-gray-100" />
      )}

      {onMarkStudied && !point.studied && (
        <button
          onClick={onMarkStudied}
          disabled={marking}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ background: '#E8002D' }}
        >
          <Icon name={marking ? 'Loader' : 'Check'} size={15} className={marking ? 'animate-spin' : ''} />
          Отметить как изученное
        </button>
      )}
    </div>
  );
}
