import type { LocationItem } from '@/api/home';
import { locKey } from './render';

interface GisMapLike { setCenter(c: number[]): void; setZoom(z: number): void; destroy(): void }
interface GisHtmlMarkerLike { getContent(): HTMLElement; destroy(): void }
interface GisNamespace {
  Map: new (el: HTMLElement, opts: { center: number[]; zoom: number; key: string }) => GisMapLike;
  HtmlMarker: new (map: GisMapLike, opts: { coordinates: number[]; html: string }) => GisHtmlMarkerLike;
}

const markerHtml = (l: LocationItem) => `<div class="map-marker" data-marker="${locKey(l)}"><i></i><b>${l.name.replace(/</g, '&lt;')}</b></div>`;

function loadGis(): Promise<GisNamespace> {
  const w = window as unknown as { mapgl?: GisNamespace };
  if (w.mapgl) return Promise.resolve(w.mapgl);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://mapgl.2gis.com/api/js/v1';
    s.async = true;
    s.onload = () => (w.mapgl ? resolve(w.mapgl) : reject(new Error('2GIS not loaded')));
    s.onerror = () => reject(new Error('2GIS blocked'));
    document.head.appendChild(s);
  });
}

function pick(key: string) {
  const card = document.querySelector<HTMLElement>(`.branch[data-branch="${key}"]`);
  if (card) card.dispatchEvent(new MouseEvent('mouseenter'));
}

function activeKey(): string {
  return document.querySelector<HTMLElement>('.branch.active')?.dataset.branch || '';
}

async function mountLeaflet(el: HTMLElement, locs: LocationItem[]): Promise<() => void> {
  const L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');
  const map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);
  el.classList.add('is-osm');
  const markers = new Map<string, L.Marker>();
  locs.forEach(l => {
    const m = L.marker([l.lat, l.lng], {
      icon: L.divIcon({ className: '', html: markerHtml(l), iconSize: [0, 0] }),
    }).addTo(map);
    m.on('click', () => pick(locKey(l)));
    markers.set(locKey(l), m);
  });
  map.fitBounds(L.latLngBounds(locs.map(l => [l.lat, l.lng] as [number, number])), { padding: [60, 60], maxZoom: 14 });

  const list = document.querySelector('.branch-list');
  const sync = () => {
    const key = activeKey();
    el.querySelectorAll('.map-marker').forEach(n => n.classList.toggle('active', (n as HTMLElement).dataset.marker === key));
    const m = markers.get(key);
    if (m) map.panTo(m.getLatLng(), { animate: true });
  };
  const obs = new MutationObserver(sync);
  if (list) obs.observe(list, { attributes: true, subtree: true, attributeFilter: ['class'] });
  return () => { obs.disconnect(); map.remove(); };
}

async function mountGis(el: HTMLElement, locs: LocationItem[], key: string): Promise<() => void> {
  const gis = await loadGis();
  const avgLat = locs.reduce((a, l) => a + l.lat, 0) / locs.length;
  const avgLng = locs.reduce((a, l) => a + l.lng, 0) / locs.length;
  const map = new gis.Map(el, { center: [avgLng, avgLat], zoom: 12, key });
  const markers = new Map<string, GisHtmlMarkerLike>();
  const coords = new Map<string, number[]>();
  locs.forEach(l => {
    const m = new gis.HtmlMarker(map, { coordinates: [l.lng, l.lat], html: markerHtml(l) });
    m.getContent().addEventListener('click', () => pick(locKey(l)));
    markers.set(locKey(l), m);
    coords.set(locKey(l), [l.lng, l.lat]);
  });
  const list = document.querySelector('.branch-list');
  const sync = () => {
    const k = activeKey();
    el.querySelectorAll('.map-marker').forEach(n => n.classList.toggle('active', (n as HTMLElement).dataset.marker === k));
    const c = coords.get(k);
    if (c) map.setCenter(c);
  };
  const obs = new MutationObserver(sync);
  if (list) obs.observe(list, { attributes: true, subtree: true, attributeFilter: ['class'] });
  return () => { obs.disconnect(); markers.forEach(m => m.destroy()); map.destroy(); };
}

export async function mountBranchMap(locs: LocationItem[], mapKey: string): Promise<() => void> {
  const el = document.getElementById('real-map');
  if (!el || !locs.length) return () => {};
  if (mapKey) {
    try {
      return await mountGis(el, locs, mapKey);
    } catch {
      el.innerHTML = '';
    }
  }
  return mountLeaflet(el, locs);
}
