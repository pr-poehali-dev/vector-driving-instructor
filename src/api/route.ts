const ROUTE_URL = 'https://functions.poehali.dev/6a38e827-6816-4409-a5bd-945281c91bba';
const TOKEN_KEY = 'vector_student_token';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';

function getStudentToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function getAdminOrManagerToken() {
  const admin = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  const manager = localStorage.getItem(MANAGER_TOKEN_KEY) || '';
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(ROUTE_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export type PointType =
  | 'start' | 'stop' | 'turn_left' | 'turn_right' | 'u_turn'
  | 'intersection' | 'crosswalk' | 'lane_change' | 'other';

export const POINT_TYPE_LABELS: Record<PointType, string> = {
  start: 'Начало маршрута',
  stop: 'Остановка',
  turn_left: 'Поворот налево',
  turn_right: 'Поворот направо',
  u_turn: 'Разворот',
  intersection: 'Перекрёсток',
  crosswalk: 'Пешеходный переход',
  lane_change: 'Перестроение',
  other: 'Другое',
};

export const POINT_TYPE_ICONS: Record<PointType, string> = {
  start: 'Flag',
  stop: 'CircleParking',
  turn_left: 'CornerUpLeft',
  turn_right: 'CornerUpRight',
  u_turn: 'RotateCcw',
  intersection: 'Shuffle',
  crosswalk: 'PersonStanding',
  lane_change: 'ArrowLeftRight',
  other: 'MapPin',
};

export interface ExamRoute {
  id: number;
  title: string;
  city: string;
  description: string;
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  sort_order: number;
  is_active?: boolean;
  points_count?: number;
  route_line?: [number, number][];
}

export interface RoutePoint {
  id: number;
  route_id?: number;
  point_number: number;
  title: string;
  point_type: PointType;
  lat: number;
  lng: number;
  video_url: string | null;
  video_title: string | null;
  video_thumb: string | null;
  description: string;
  action_steps: string[];
  common_mistakes: string[];
  pdd_refs: string[];
  scheme_image_url: string | null;
  difficulty: 'easy' | 'normal' | 'hard';
  sort_order?: number;
  is_active?: boolean;
  studied?: boolean;
}

export interface RouteDetail extends ExamRoute {
  route_line: [number, number][];
  points: RoutePoint[];
}

// ─── Public / student ───────────────────────────────────────────────────────
export async function getRoutes(): Promise<{ routes: ExamRoute[] }> {
  return api({ action: 'get_routes' });
}

export async function getRoute(route_id: number): Promise<{ route: RouteDetail }> {
  return api({ action: 'get_route', route_id }, getStudentToken());
}

export async function markPointStudied(route_point_id: number) {
  return api({ action: 'mark_point_studied', route_point_id }, getStudentToken());
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export async function getAllRoutesAdmin(): Promise<{ routes: (ExamRoute & { route_line: [number, number][] })[] }> {
  return api({ action: 'get_all_routes' }, getAdminOrManagerToken());
}

export async function saveRouteAdmin(data: Partial<ExamRoute> & { title: string }) {
  return api({ action: 'save_route', ...data }, getAdminOrManagerToken());
}

export async function deleteRouteAdmin(id: number) {
  return api({ action: 'delete_route', id }, getAdminOrManagerToken());
}

export async function getRoutePointsAdmin(route_id: number): Promise<{ points: RoutePoint[] }> {
  return api({ action: 'get_route_points', route_id }, getAdminOrManagerToken());
}

export async function saveRoutePointAdmin(data: Partial<RoutePoint> & { route_id: number; title: string }) {
  return api({ action: 'save_route_point', ...data }, getAdminOrManagerToken());
}

export async function deleteRoutePointAdmin(id: number) {
  return api({ action: 'delete_route_point', id }, getAdminOrManagerToken());
}

export async function reorderRoutePointsAdmin(order: { id: number; sort_order: number }[]) {
  return api({ action: 'reorder_route_points', order }, getAdminOrManagerToken());
}