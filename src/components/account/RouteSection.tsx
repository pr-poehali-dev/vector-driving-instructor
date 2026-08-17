import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { getRoutes, getRoute, markPointStudied, ExamRoute, RouteDetail as RouteDetailType, RoutePoint, POINT_TYPE_LABELS } from '@/api/route';
import RouteMap, { pointStatusColor } from './RouteMap';
import RoutePointCard from './RoutePointCard';

function PointListItem({ point, active, onClick }: { point: RoutePoint; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        active ? 'bg-red-50 border border-[#E8002D]/30' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pointStatusColor(point) }} />
      <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">№{point.point_number} {point.title}</span>
      {point.video_url && <Icon name="Video" size={13} className="text-gray-300 flex-shrink-0" />}
      {point.studied && <Icon name="Check" size={13} className="text-green-500 flex-shrink-0" />}
    </button>
  );
}

function RouteDetailView({ route, onBack }: { route: ExamRoute; onBack: () => void }) {
  const [detail, setDetail] = useState<RouteDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePointId, setActivePointId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [marking, setMarking] = useState(false);

  const load = useCallback(() => {
    getRoute(route.id).then(d => { setDetail(d.route); setLoading(false); }).catch(() => setLoading(false));
  }, [route.id]);

  useEffect(() => { load(); }, [load]);

  const activePoint = detail?.points.find(p => p.id === activePointId) || null;

  const handlePointClick = (point: RoutePoint) => {
    setActivePointId(point.id);
  };

  const handleMarkStudied = async () => {
    if (!activePoint) return;
    setMarking(true);
    try {
      await markPointStudied(activePoint.id);
      setDetail(prev => prev ? { ...prev, points: prev.points.map(p => p.id === activePoint.id ? { ...p, studied: true } : p) } : prev);
    } finally {
      setMarking(false);
    }
  };

  if (loading || !detail) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  const studiedCount = detail.points.filter(p => p.studied).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
          <Icon name="ArrowLeft" size={15} />
          К маршрутам
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Изучено: <span className="font-semibold text-[#1a1a1a]">{studiedCount}/{detail.points.length}</span>
          </span>
          <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
            <button onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500'}`}>
              <Icon name="Map" size={13} />
              Карта
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500'}`}>
              <Icon name="List" size={13} />
              Все точки
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">{detail.title}</h2>
        {detail.description && <p className="text-sm text-gray-400 mt-0.5">{detail.description}</p>}
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detail.points.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: pointStatusColor(p) }}>
                {p.point_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a] truncate">{p.title}</p>
                <p className="text-xs text-gray-400">{POINT_TYPE_LABELS[p.point_type]}</p>
              </div>
              {p.studied ? (
                <Icon name="CheckCircle2" size={18} className="text-green-500 flex-shrink-0" />
              ) : (
                <button onClick={() => { setViewMode('map'); handlePointClick(p); }} className="text-[#E8002D] flex-shrink-0">
                  <Icon name="ArrowRight" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2" style={{ height: 340 }}>
              <RouteMap
                centerLat={detail.center_lat}
                centerLng={detail.center_lng}
                zoom={detail.zoom_level}
                routeLine={detail.route_line}
                points={detail.points}
                activePointId={activePointId}
                onPointClick={handlePointClick}
              />
            </div>
            {/* Список точек под картой — компактная навигация (виден и на десктопе, и на мобильном) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col gap-0.5 max-h-56 overflow-y-auto chat-scroll">
              {detail.points.map(p => (
                <PointListItem key={p.id} point={p} active={p.id === activePointId} onClick={() => handlePointClick(p)} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {activePoint ? (
              <RoutePointCard point={activePoint} onMarkStudied={handleMarkStudied} marking={marking} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <Icon name="MousePointerClick" size={24} className="mx-auto mb-2 text-gray-200" />
                Выберите точку на карте или в списке, чтобы посмотреть видео и разбор
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RouteSection() {
  const [routes, setRoutes] = useState<ExamRoute[]>([]);
  const [selected, setSelected] = useState<ExamRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoutes().then(d => {
      setRoutes(d.routes);
      if (d.routes.length === 1) setSelected(d.routes[0]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  if (selected) return <RouteDetailView route={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Экзаменационный маршрут</h2>
      {routes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="Map" size={28} className="mx-auto mb-2 text-gray-200" />
          Маршруты пока не добавлены
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routes.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-gray-200 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="Map" size={18} className="text-[#E8002D]" />
                </div>
                <div className="min-w-0">
                  <p className="font-montserrat font-bold text-[#1a1a1a] truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.city} · {r.points_count} точек</p>
                </div>
              </div>
              {r.description && <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
