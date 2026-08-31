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
}

export interface InstructorKpiRow {
  instructor_id: number;
  period: string;
  pdd_test_passed: boolean;
  pdd_test_points: number;
  practical_pass_percent: number;
  practical_passed: number;
  practical_total: number;
  practical_points: number;
  students_at_exam: number;
  students_at_exam_points: number;
  reviews_count: number;
  reviews_points: number;
  package_upgrades: number;
  package_upgrades_points: number;
  discipline_points: number;
  service_points: number;
  rank_in_branch: number | null;
  bonus_amount: number;
  bonus_label: string;
}

function adminToken() { return localStorage.getItem('vector_admin_token') || ''; }

async function call(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const getInstructors = (): Promise<{ instructors: InstructorRow[] }> =>
  call({ action: 'instructors-list' }, adminToken());

export const addInstructor = (d: { name: string; login: string; password: string; branch_id?: number | null; car_model?: string }) =>
  call({ action: 'instructors-add', ...d }, adminToken());

export const updateInstructor = (d: { id: number; name?: string; branch_id?: number | null; car_model?: string; password?: string; is_active?: boolean }) =>
  call({ action: 'instructors-update', ...d }, adminToken());

export const removeInstructor = (id: number) =>
  call({ action: 'instructors-remove', id }, adminToken());

export const getInstructorKpi = (instructor_id: number, period?: string): Promise<{ kpi: InstructorKpiRow | null; period: string }> =>
  call({ action: 'instructors-kpi-get', instructor_id, period }, adminToken());

export const saveInstructorKpi = (d: Partial<InstructorKpiRow> & { instructor_id: number; period: string }) =>
  call({ action: 'instructors-kpi-save', ...d }, adminToken());
