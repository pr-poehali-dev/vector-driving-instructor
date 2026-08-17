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

function statusColor(studied: boolean | undefined, active: boolean): string {
  if (active) return '#7c3aed';
  if (studied) return '#16a34a';
  return '#E8002D';
}

function makeDivIcon(point: RoutePoint, active: boolean): L.DivIcon {
  const color = statusColor(point.studied, active);
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${active ? 34 : 28}px; height: ${active ? 34 : 28}px;
      background: ${color}; border: 2.5px solid white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: ${active ? 13 : 11}px; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      transform: ${active ? 'scale(1.05)' : 'scale(1)'};
      transition: all 0.2s;
    ">${point.point_number}</div>`,
    iconSize: [active ? 34 : 28, active ? 34 : 28],
    iconAnchor: [active ? 17 : 14, active ? 17 : 14],
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
  carPosition?: [number, number] | null;
}

export default function RouteMap({ centerLat, centerLng, zoom, routeLine, points, activePointId, onPointClick, carPosition }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const carMarkerRef = useRef<L.Marker | null>(null);
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
      carMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Линия маршрута — рисуем один раз при смене маршрута
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !routeLine.length) return;
    const line = L.polyline(routeLine, { color: '#1a1a1a', weight: 4, opacity: 0.6, dashArray: '8 6' }).addTo(map);
    if (routeLine.length > 1) {
      map.fitBounds(L.latLngBounds(routeLine), { padding: [30, 30] });
    }
    return () => { line.remove(); };
  }, [routeLine]);

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
      if (active && map) map.panTo([active.lat, active.lng], { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePointId]);

  // Маркер автомобиля, движущийся синхронно с видео
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (!carPosition) {
      carMarkerRef.current?.remove();
      carMarkerRef.current = null;
      return;
    }
    const carIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 20px; height: 20px; background: #7c3aed; border: 3px solid white; border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(124,58,237,0.25), 0 2px 6px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(carPosition, { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      carMarkerRef.current.setLatLng(carPosition);
    }
  }, [carPosition]);

  return <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 320 }} />;
}

export { POINT_TYPE_ICONS };