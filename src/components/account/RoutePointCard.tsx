import Icon from '@/components/ui/icon';
import { RoutePoint, POINT_TYPE_LABELS, POINT_TYPE_ICONS } from '@/api/route';

const DIFFICULTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'Изучено', color: 'text-green-600', bg: 'bg-green-500' },
  normal: { label: 'Не изучено', color: 'text-amber-600', bg: 'bg-amber-500' },
  hard: { label: 'Сложный участок', color: 'text-red-600', bg: 'bg-red-500' },
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface Props {
  point: RoutePoint;
  onMarkStudied?: () => void;
  marking?: boolean;
}

export default function RoutePointCard({ point, onMarkStudied, marking }: Props) {
  const statusKey = point.studied ? 'easy' : point.difficulty === 'hard' ? 'hard' : 'normal';
  const status = DIFFICULTY_LABELS[statusKey];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 mb-1.5">
              {POINT_TYPE_LABELS[point.point_type]}
            </span>
            <h3 className="font-montserrat font-black text-[17px] text-[#152a4a] leading-snug">{point.title}</h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0`} style={{ background: statusKey === 'easy' ? '#10b981' : statusKey === 'hard' ? '#ef4444' : '#f59e0b' }}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Icon name={POINT_TYPE_ICONS[point.point_type]} size={13} className="text-gray-400" fallback="MapPin" />
          Точка №{point.point_number} · {fmtTime(point.video_timestamp_sec)} на видео
        </div>

        {point.description && (
          <p className="text-[13px] text-gray-600 leading-relaxed">{point.description}</p>
        )}

        {point.action_steps?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#152a4a] uppercase tracking-wide mb-2">Порядок выполнения манёвра:</p>
            <ol className="pl-5 flex flex-col gap-1 text-[13px] text-gray-700 leading-relaxed list-decimal">
              {point.action_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {point.common_mistakes?.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg px-4 py-3">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Icon name="AlertOctagon" size={13} />
              Типичные экзаменационные ошибки
            </p>
            <ul className="pl-4 flex flex-col gap-1 text-xs text-red-800 leading-relaxed list-disc">
              {point.common_mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {point.pdd_refs?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Связанные пункты ПДД:</p>
            <div className="flex flex-wrap gap-1.5">
              {point.pdd_refs.map((r, i) => (
                <span key={i} className="text-[11px] font-semibold px-2 py-1 rounded-md bg-gray-100 text-[#152a4a] border border-gray-200">{r}</span>
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
    </div>
  );
}
