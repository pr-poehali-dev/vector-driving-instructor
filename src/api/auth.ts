const AUTH_URL = 'https://functions.poehali.dev/91d1428e-bbd8-4752-8935-f887499c26bb';
const STUDENTS_URL = 'https://functions.poehali.dev/33d2faf5-4850-46ba-9d00-c518651f4cab';

const TOKEN_KEY = 'vector_student_token';
const ADMIN_TOKEN_KEY = 'vector_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; }

async function api(url: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// ─── student auth ────────────────────────────────────────────────────────────

export async function studentLogin(login: string, password: string) {
  const data = await api(AUTH_URL, { action: 'login', login, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function studentMe() {
  const token = getToken();
  if (!token) throw new Error('Нет токена');
  return api(AUTH_URL, { action: 'me' }, token);
}

export async function studentLogout() {
  const token = getToken();
  localStorage.removeItem(TOKEN_KEY);
  if (token) await api(AUTH_URL, { action: 'logout' }, token).catch(() => {});
}

// ─── admin auth ──────────────────────────────────────────────────────────────

export async function adminLogin(password: string) {
  const data = await api(AUTH_URL, { action: 'admin-login', password });
  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data;
}

export async function adminMe() {
  const token = getAdminToken();
  if (!token) throw new Error('Нет токена');
  return api(AUTH_URL, { action: 'admin-me' }, token);
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// ─── students management ─────────────────────────────────────────────────────

export async function getStudents() {
  return api(STUDENTS_URL, { action: 'list' }, getAdminToken());
}

export async function addStudent(data: { name: string; login: string; password: string; notes?: string }) {
  return api(STUDENTS_URL, { action: 'add', ...data }, getAdminToken());
}

export async function updateStudent(data: { id: number; name?: string; is_active?: boolean; notes?: string; password?: string }) {
  return api(STUDENTS_URL, { action: 'update', ...data }, getAdminToken());
}
