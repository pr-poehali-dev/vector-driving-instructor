import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoutePoint, POINT_TYPE_ICONS } from '@/api/route';

// Leaflet по умолчанию грузит маркеры через относительные пути, которые ломаются
// в сборке Vite — подключаем иконки явно с CDN.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Цвета соответствуют легенде: зелёный — изучено, жёлтый — не изучено, красный — сложный участок
export function pointStatusColor(point: RoutePoint): string {
  if (point.studied) return '#10b981';
  if (point.difficulty === 'hard') return '#ef4444';
  return '#f59e0b';
}

function makeDivIcon(point: RoutePoint, active: boolean): L.DivIcon {
  const color = pointStatusColor(point);
  const size = active ? 34 : 28;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color}; border: 2.5px solid white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: ${active ? 13 : 11}px; font-weight: 800;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35)${active ? ', 0 0 0 5px rgba(232,0,45,0.25)' : ''};
      transition: all 0.2s;
    ">${point.point_number}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  centerLat: number;
  centerLng: number;
  zoom: number;
  routeLine: [number, number][];
  points: RoutePoint[];
  activePointId: number | null;
  onPointClick: (point: RoutePoint) => void;
}

export default function RouteMap({ centerLat, centerLng, zoom, routeLine, points, activePointId, onPointClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const onPointClickRef = useRef(onPointClick);
  onPointClickRef.current = onPointClick;

  // Инициализация карты (один раз)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([centerLat, centerLng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;

    return () => {
      const markers = markersRef.current;
      map.remove();
      mapInstance.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Линия маршрута — рисуем один раз при смене маршрута
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !routeLine.length) return;
    const line = L.polyline(routeLine, { color: '#E8002D', weight: 5, opacity: 0.8, dashArray: '8 8' }).addTo(map);
    if (routeLine.length > 1) {
      map.fitBounds(L.latLngBounds(routeLine), { padding: [30, 30] });
    }
    return () => { line.remove(); };
  }, [routeLine]);

  // Если линии маршрута нет (или точек много и они разбросаны по городу) —
  // подгоняем карту под все точки, чтобы все маркеры были видны сразу
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || routeLine.length || points.length < 2) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);

  // Маркеры точек — пересоздаём при смене списка точек
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    points.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: makeDivIcon(point, point.id === activePointId) })
        .addTo(map)
        .bindTooltip(`№${point.point_number} — ${point.title}`, { direction: 'top', offset: [0, -14] })
        .on('click', () => onPointClickRef.current(point));
      markersRef.current.set(point.id, marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Подсветка активной точки без пересоздания всех маркеров
  useEffect(() => {
    points.forEach(point => {
      const marker = markersRef.current.get(point.id);
      if (marker) marker.setIcon(makeDivIcon(point, point.id === activePointId));
    });
    if (activePointId != null) {
      const active = points.find(p => p.id === activePointId);
      const map = mapInstance.current;
      if (active && map) map.flyTo([active.lat, active.lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePointId]);

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: 320 }} />;
}

export { POINT_TYPE_ICONS };