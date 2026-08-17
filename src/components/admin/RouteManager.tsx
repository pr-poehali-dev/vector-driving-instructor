import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '@/components/ui/icon';
import {
  ExamRoute, RoutePoint, PointType, POINT_TYPE_LABELS,
  getAllRoutesAdmin, saveRouteAdmin, deleteRouteAdmin,
  getRoutePointsAdmin, saveRoutePointAdmin, deleteRoutePointAdmin,
} from '@/api/route';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const POINT_TYPES = Object.keys(POINT_TYPE_LABELS) as PointType[];

// ── Видео helpers (аналогично разделу "Контент бота") ───────────────────────
function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}
function ytIdFromUrl(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : '';
}
function ytEmbedUrl(raw: string): string {
  if (raw.includes('youtube.com/embed/')) return raw;
  const id = ytIdFromUrl(raw);
  return id ? `https://www.youtube.com/embed/${id}` : raw;
}
function ytThumb(embedUrl: string): string {
  const id = ytIdFromUrl(embedUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}
function rtIdFromUrl(url: string): string {
  const m = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : '';
}
function rtEmbedUrl(raw: string): string {
  if (raw.includes('rutube.ru/play/embed/')) return raw;
  const id = rtIdFromUrl(raw);
  return id ? `https://rutube.ru/play/embed/${id}` : raw;
}
function resolveVideoUrl(raw: string): string {
  if (!raw) return '';
  if (isDirectVideoUrl(raw)) return raw;
  if (raw.includes('rutube.ru')) return rtEmbedUrl(raw);
  return ytEmbedUrl(raw);
}
function resolveVideoThumb(raw: string): string {
  if (!raw) return '';
  if (isDirectVideoUrl(raw)) return '';
  if (raw.includes('rutube.ru')) return '';
  return ytThumb(ytEmbedUrl(raw));
}

// ── Форма маршрута ──────────────────────────────────────────────────────────
function RouteForm({ route, onClose, onSaved }: { route?: ExamRoute | null; onClose: () => void; onSaved: (r: ExamRoute) => void }) {
  const [title, setTitle] = useState(route?.title || '');
  const [city, setCity] = useState(route?.city || 'Курган');
  const [description, setDescription] = useState(route?.description || '');
  const [centerLat, setCenterLat] = useState(route?.center_lat ?? 55.45);
  const [centerLng, setCenterLng] = useState(route?.center_lng ?? 65.3333);
  const [zoom, setZoom] = useState(route?.zoom_level ?? 14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await saveRouteAdmin({
        id: route?.id, title, city, description,
        center_lat: centerLat, center_lng: centerLng, zoom_level: zoom, sort_order: route?.sort_order || 0,
      });
      onSaved(data.route);
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
          <h3 className="font-montserrat font-bold text-base">{route ? 'Редактировать маршрут' : 'Новый маршрут'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Название маршрута</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Экзаменационный маршрут №1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Город</label>
              <input value={city} onChange={e => setCity(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Масштаб карты</label>
              <input type="number" min={10} max={19} value={zoom} onChange={e => setZoom(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Центр карты — широта</label>
              <input type="number" step="0.0001" value={centerLat} onChange={e => setCenterLat(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Центр карты — долгота</label>
              <input type="number" step="0.0001" value={centerLng} onChange={e => setCenterLng(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : route ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Мини-карта для выбора координат клином ──────────────────────────────────
function PickerMap({ lat, lng, zoom, onPick }: { lat: number; lng: number; zoom: number; onPick: (lat: number, lng: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onPickRef.current(p.lat, p.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const current = markerRef.current.getLatLng();
      if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng]);

  return <div ref={ref} className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 260 }} />;
}

// ── Форма точки маршрута ────────────────────────────────────────────────────
function PointForm({ routeId, defaultCenter, point, nextNumber, onClose, onSaved }: {
  routeId: number; defaultCenter: { lat: number; lng: number; zoom: number };
  point?: RoutePoint | null; nextNumber: number; onClose: () => void; onSaved: (p: RoutePoint) => void;
}) {
  const [title, setTitle] = useState(point?.title || '');
  const [pointType, setPointType] = useState<PointType>(point?.point_type || 'other');
  const [lat, setLat] = useState(point?.lat ?? defaultCenter.lat);
  const [lng, setLng] = useState(point?.lng ?? defaultCenter.lng);
  const [pointNumber, setPointNumber] = useState(point?.point_number ?? nextNumber);
  const [videoRaw, setVideoRaw] = useState(point?.video_url || '');
  const [videoTitle, setVideoTitle] = useState(point?.video_title || '');
  const [description, setDescription] = useState(point?.description || '');
  const [steps, setSteps] = useState((point?.action_steps || []).join('\n'));
  const [mistakes, setMistakes] = useState((point?.common_mistakes || []).join('\n'));
  const [pddRefs, setPddRefs] = useState((point?.pdd_refs || []).join('\n'));
  const [schemeUrl, setSchemeUrl] = useState(point?.scheme_image_url || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>(point?.difficulty || 'normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const embedUrl = videoRaw ? resolveVideoUrl(videoRaw) : null;
      const thumb = embedUrl ? resolveVideoThumb(videoRaw) : null;
      const data = await saveRoutePointAdmin({
        id: point?.id, route_id: routeId, point_number: pointNumber, title, point_type: pointType,
        lat, lng, video_url: embedUrl || undefined, video_title: videoTitle || undefined, video_thumb: thumb || undefined,
        description,
        action_steps: steps.split('\n').map(s => s.trim()).filter(Boolean),
        common_mistakes: mistakes.split('\n').map(s => s.trim()).filter(Boolean),
        pdd_refs: pddRefs.split('\n').map(s => s.trim()).filter(Boolean),
        scheme_image_url: schemeUrl || undefined,
        difficulty, sort_order: pointNumber,
      });
      onSaved(data.point);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-montserrat font-bold text-base">{point ? 'Редактировать точку' : 'Новая точка маршрута'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Номер точки</label>
            <input type="number" min={1} value={pointNumber} onChange={e => setPointNumber(Number(e.target.value))} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Название точки</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="ул. Пролетарская — ул. К. Мяготина"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Видео точки (mp4 или YouTube/Rutube)</label>
              <input value={videoRaw} onChange={e => setVideoRaw(e.target.value)} placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Подпись видео</label>
              <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Например: Проезд перекрёстка"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Тип задания</label>
            <div className="flex flex-wrap gap-1.5">
              {POINT_TYPES.map(t => (
                <button type="button" key={t} onClick={() => setPointType(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${pointType === t ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {POINT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Положение на карте (кликните или перетащите маркер)</label>
            <PickerMap lat={lat} lng={lng} zoom={defaultCenter.zoom} onPick={(la, ln) => { setLat(la); setLng(ln); }} />
            <p className="text-xs text-gray-400 mt-1">Широта: {lat.toFixed(5)} · Долгота: {lng.toFixed(5)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Описание манёвра</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Порядок выполнения (каждый шаг с новой строки)</label>
            <textarea value={steps} onChange={e => setSteps(e.target.value)} rows={4} placeholder={'Подготовиться к манёвру\nЗанять нужное положение\n...'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Типичные ошибки (каждая с новой строки)</label>
            <textarea value={mistakes} onChange={e => setMistakes(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Пункты ПДД (каждый с новой строки)</label>
            <textarea value={pddRefs} onChange={e => setPddRefs(e.target.value)} rows={2} placeholder={'п. 8.5 ПДД РФ — ...'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-y transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Схема манёвра (URL изображения, необязательно)</label>
            <input value={schemeUrl} onChange={e => setSchemeUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Сложность</label>
            <div className="flex gap-1.5">
              {(['easy', 'normal', 'hard'] as const).map(d => (
                <button type="button" key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${difficulty === d ? 'bg-[#E8002D] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {d === 'easy' ? 'Простой' : d === 'normal' ? 'Средний' : 'Сложный'}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><Icon name="AlertCircle" size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : point ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Level = { view: 'routes' } | { view: 'points'; route: ExamRoute };

export default function RouteManager() {
  const [routes, setRoutes] = useState<ExamRoute[]>([]);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [level, setLevel] = useState<Level>({ view: 'routes' });
  const [loading, setLoading] = useState(true);

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editRoute, setEditRoute] = useState<ExamRoute | null>(null);
  const [showPointForm, setShowPointForm] = useState(false);
  const [editPoint, setEditPoint] = useState<RoutePoint | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'route' | 'point'; id: number; label: string } | null>(null);

  useEffect(() => {
    getAllRoutesAdmin().then(d => setRoutes(d.routes)).finally(() => setLoading(false));
  }, []);

  const openPoints = (route: ExamRoute) => {
    setLevel({ view: 'points', route });
    setLoading(true);
    getRoutePointsAdmin(route.id).then(d => setPoints(d.points)).finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'route') {
      await deleteRouteAdmin(confirmDelete.id);
      setRoutes(prev => prev.filter(r => r.id !== confirmDelete.id));
    } else {
      await deleteRoutePointAdmin(confirmDelete.id);
      setPoints(prev => prev.filter(p => p.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <button onClick={() => setLevel({ view: 'routes' })} className={`font-semibold ${level.view === 'routes' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'}`}>
          Маршруты
        </button>
        {level.view === 'points' && (
          <>
            <Icon name="ChevronRight" size={14} className="text-gray-300" />
            <span className="font-semibold text-[#1a1a1a] truncate">{level.route.title}</span>
          </>
        )}
      </div>

      {level.view === 'routes' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Экзаменационные маршруты, доступные в кабинете ученика</p>
            <button onClick={() => { setEditRoute(null); setShowRouteForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
              <Icon name="Plus" size={15} />
              Добавить маршрут
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div> : (
            <div className="flex flex-col gap-2.5">
              {routes.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <button onClick={() => openPoints(r)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Icon name="Map" size={16} className="text-[#E8002D]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.city}</p>
                    </div>
                  </button>
                  <button onClick={() => { setEditRoute(r); setShowRouteForm(true); }} className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete({ type: 'route', id: r.id, label: r.title })} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Icon name="Trash2" size={14} />
                  </button>
                  <button onClick={() => openPoints(r)} className="p-2 text-gray-300"><Icon name="ChevronRight" size={16} /></button>
                </div>
              ))}
              {routes.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Маршрутов пока нет</div>}
            </div>
          )}
        </>
      )}

      {level.view === 'points' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Точки маршрута «{level.route.title}»</p>
            <button onClick={() => { setEditPoint(null); setShowPointForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
              <Icon name="Plus" size={15} />
              Добавить точку
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={22} className="animate-spin mx-auto" /></div> : (
            <div className="flex flex-col gap-2.5">
              {points.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {p.point_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      {POINT_TYPE_LABELS[p.point_type]}
                      {p.video_url && <><span>·</span><Icon name="Video" size={11} className="text-gray-400" />видео есть</>}
                    </p>
                  </div>
                  <button onClick={() => { setEditPoint(p); setShowPointForm(true); }} className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete({ type: 'point', id: p.id, label: p.title })} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              ))}
              {points.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">Точек пока нет</div>}
            </div>
          )}
        </>
      )}

      {showRouteForm && (
        <RouteForm route={editRoute} onClose={() => setShowRouteForm(false)} onSaved={r => setRoutes(prev => {
          const idx = prev.findIndex(x => x.id === r.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = r; return next; }
          return [...prev, r];
        })} />
      )}

      {showPointForm && level.view === 'points' && (
        <PointForm
          routeId={level.route.id}
          defaultCenter={{ lat: editPoint?.lat ?? level.route.center_lat, lng: editPoint?.lng ?? level.route.center_lng, zoom: level.route.zoom_level }}
          point={editPoint}
          nextNumber={points.length + 1}
          onClose={() => setShowPointForm(false)}
          onSaved={p => setPoints(prev => {
            const idx = prev.findIndex(x => x.id === p.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = p; return next; }
            return [...prev, p].sort((a, b) => a.point_number - b.point_number);
          })}
        />
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