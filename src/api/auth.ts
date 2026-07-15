const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

const TOKEN_KEY = 'vector_student_token';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; }
function getAccessToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(MANAGER_TOKEN_KEY) || ''; }

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// ─── student auth ─────────────────────────────────────────────────────────────
export async function studentLogin(login: string, password: string) {
  const data = await api({ action: 'login', login, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function studentMe() {
  const token = getToken();
  if (!token) throw new Error('Нет токена');
  return api({ action: 'me' }, token);
}

export async function studentLogout() {
  const token = getToken();
  localStorage.removeItem(TOKEN_KEY);
  if (token) await api({ action: 'logout' }, token).catch(() => {});
}

// ─── admin auth ───────────────────────────────────────────────────────────────
export async function adminLogin(password: string) {
  const data = await api({ action: 'admin-login', password });
  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data;
}

export async function adminMe() {
  const token = getAdminToken();
  if (!token) throw new Error('Нет токена');
  return api({ action: 'admin-me' }, token);
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// ─── students management ──────────────────────────────────────────────────────
export async function getStudents() {
  return api({ action: 'students-list' }, getAccessToken());
}

export async function addStudent(data: { name: string; login: string; password: string; notes?: string; access_until?: string | null }) {
  return api({ action: 'students-add', ...data }, getAccessToken());
}

export async function updateStudent(data: { id: number; name?: string; is_active?: boolean; notes?: string; password?: string; access_until?: string | null }) {
  return api({ action: 'students-update', ...data }, getAccessToken());
}

export async function removeStudent(id: number) {
  return api({ action: 'students-remove', id }, getAccessToken());
}