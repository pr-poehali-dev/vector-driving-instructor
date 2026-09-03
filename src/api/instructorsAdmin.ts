const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

export interface InstructorRow {
  id: number;
  name: string;
  login: string;
  branch_id: number | null;
  branch_name: string | null;
  car_model: string;
  is_active: boolean;
  created_at: string;
  last_seen: string | null;
  plain_password: string | null;
}

// Строка общей таблицы KPI (аналог листа "Рейтинг мастеров" в Excel)
export interface KpiTableRow {
  instructor_id: number;
  name: string;
  login: string;
  branch_name: string | null;
  is_active: boolean;
  // сырые факты (вводятся вручную)
  reviews: number;
  exams: number;
  passed: number;
  package_upgrades_n: number;
  pdd_status: string; // 'Сдал' | ''
  discipline: number;
  service: number;
  note: string;
  // посчитанные баллы (только для чтения)
  reviews_points: number;
  exams_points: number;
  pass_percent: number;
  pass_points: number;
  upgrades_points: number;
  pdd_points: number;
  total_score: number;
  rank: number;
}

export interface VideoFile {
  id: number;
  file_name: string;
  file_size: number;
  s3_url: string;
  uploaded_at: string;
}

export interface InstructorShiftGroup {
  shift_date: string;
  files: VideoFile[];
  total_size: number;
}

export interface InstructorVideos {
  instructor_id: number;
  instructor_name: string;
  shifts: InstructorShiftGroup[];
}

function accessToken() {
  const admin = localStorage.getItem('vector_admin_token') || '';
  const manager = localStorage.getItem('vector_manager_token') || '';
  // На странице менеджера в приоритете токен менеджера — в браузере может
  // остаться старый/просроченный токен администратора от прошлого захода в /admin.
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

async function call(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const getInstructors = (): Promise<{ instructors: InstructorRow[] }> =>
  call({ action: 'instructors-list' }, accessToken());

export const addInstructor = (d: { name: string; login: string; password: string; branch_id?: number | null; car_model?: string }) =>
  call({ action: 'instructors-add', ...d }, accessToken());

export const updateInstructor = (d: { id: number; name?: string; branch_id?: number | null; car_model?: string; password?: string; is_active?: boolean }) =>
  call({ action: 'instructors-update', ...d }, accessToken());

export const removeInstructor = (id: number) =>
  call({ action: 'instructors-remove', id }, accessToken());

export const getKpiTable = (period?: string): Promise<{ rows: KpiTableRow[]; period: string }> =>
  call({ action: 'instructors-kpi-table', period }, accessToken());

export const saveKpiRow = (d: {
  instructor_id: number; period: string; reviews: number; exams: number; passed: number;
  package_upgrades_n: number; pdd_status: string; discipline: number; service: number; note: string;
}) => call({ action: 'instructors-kpi-save-row', ...d }, accessToken());

export const getInstructorVideos = (): Promise<{ instructors: InstructorVideos[] }> =>
  call({ action: 'instructor-videos-list' }, accessToken());

export const getInstructorVideoUrl = (video_id: number): Promise<{ url: string }> =>
  call({ action: 'instructor-video-url', video_id }, accessToken());