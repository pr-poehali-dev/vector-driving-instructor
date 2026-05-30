const MANAGERS_URL = 'https://functions.poehali.dev/caf5fd6a-37a6-4f44-bad4-213d5427c6a5';
const AUTH_URL = 'https://functions.poehali.dev/91d1428e-bbd8-4752-8935-f887499c26bb';

const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';

export interface Manager {
  id: number;
  name: string;
  login: string;
  can_students: boolean;
  can_content: boolean;
  can_ai: boolean;
  can_stats: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ManagerPermissions {
  students: boolean;
  content: boolean;
  ai: boolean;
  stats: boolean;
}

export interface ManagerSession {
  role: 'manager';
  name: string;
  permissions: ManagerPermissions;
}

function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; }
function getManagerToken() { return localStorage.getItem(MANAGER_TOKEN_KEY) || ''; }

async function api(url: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// ── Вход / выход менеджера ────────────────────────────────────────────────────
export async function managerLogin(login: string, password: string): Promise<ManagerSession> {
  const data = await api(AUTH_URL, { action: 'manager-login', login, password });
  localStorage.setItem(MANAGER_TOKEN_KEY, data.token);
  return data;
}

export async function managerMe(): Promise<ManagerSession> {
  const token = getManagerToken();
  if (!token) throw new Error('Нет токена');
  return api(AUTH_URL, { action: 'manager-me' }, token);
}

export function managerLogout() {
  localStorage.removeItem(MANAGER_TOKEN_KEY);
}

// ── CRUD менеджеров (только для админа) ───────────────────────────────────────
export async function getManagers(): Promise<{ managers: Manager[] }> {
  return api(MANAGERS_URL, { action: 'list' }, getAdminToken());
}

export async function addManager(data: {
  name: string; login: string; password: string;
  can_students: boolean; can_content: boolean; can_ai: boolean; can_stats: boolean;
}) {
  return api(MANAGERS_URL, { action: 'add', ...data }, getAdminToken());
}

export async function updateManager(data: Partial<Manager> & { id: number; password?: string }) {
  return api(MANAGERS_URL, { action: 'update', ...data }, getAdminToken());
}

export async function removeManager(id: number) {
  return api(MANAGERS_URL, { action: 'remove', id }, getAdminToken());
}
