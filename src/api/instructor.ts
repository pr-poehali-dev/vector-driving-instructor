const API_URL = 'https://functions.poehali.dev/b8766d47-c939-40db-9fa3-1d295e933354';

const TOKEN_KEY = 'vector_instructor_token';

export interface InstructorSession {
  role: 'instructor';
  name: string;
  branch_name: string | null;
  car_model: string;
}

export interface KpiData {
  period: string;
  total_score: number;
  rank_in_branch: number | null;
  bonus_amount: number;
  bonus_label: string;
  pdd_test: { passed: boolean; points: number };
  practical: { pass_percent: number; passed: number; total: number; points: number };
  students_at_exam: { count: number; points: number };
  reviews: { count: number; points: number };
  package_upgrades: { count: number; points: number };
  discipline_points: number;
  service_points: number;
}

export interface VideoFile {
  id: number;
  file_name: string;
  file_size: number;
  s3_url: string;
  uploaded_at: string;
}

export interface ShiftGroup {
  shift_date: string;
  files: VideoFile[];
  total_size: number;
}

export interface PddQuestion {
  id: number;
  text: string;
  image_url: string | null;
  options: string[];
}

export interface PddAnswerResult {
  question_id: number;
  selected_index: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
}

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export async function instructorLogin(login: string, password: string): Promise<InstructorSession> {
  const data = await api({ action: 'login', login, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function instructorMe(): Promise<InstructorSession> {
  const token = getToken();
  if (!token) throw new Error('Нет токена');
  return api({ action: 'me' }, token);
}

export async function instructorLogout() {
  const token = getToken();
  localStorage.removeItem(TOKEN_KEY);
  if (token) await api({ action: 'logout' }, token).catch(() => {});
}

export async function getKpi(period?: string): Promise<{ kpi: KpiData | null }> {
  return api({ action: 'get_kpi', period }, getToken());
}

export async function uploadVideo(shiftDate: string, fileName: string, contentBase64: string): Promise<VideoFile> {
  return api({ action: 'upload_video', shift_date: shiftDate, file_name: fileName, content_base64: contentBase64 }, getToken());
}

export async function getArchive(): Promise<{ shifts: ShiftGroup[] }> {
  return api({ action: 'get_archive' }, getToken());
}

export async function startPddTest(): Promise<{ session_id: number; questions: PddQuestion[] }> {
  return api({ action: 'start_pdd_test' }, getToken());
}

export async function submitPddTest(sessionId: number, answers: { question_id: number; selected_index: number }[]): Promise<{ correct_count: number; total_questions: number; passed: boolean; results: PddAnswerResult[] }> {
  return api({ action: 'submit_pdd_test', session_id: sessionId, answers }, getToken());
}
