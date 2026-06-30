const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

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
  last_seen: string | null;
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

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export async function managerLogin(login: string, password: string): Promise<ManagerSession> {
  const data = await api({ action: 'manager-login', login, password });
  localStorage.setItem(MANAGER_TOKEN_KEY, data.token);
  return data;
}

export async function managerMe(): Promise<ManagerSession> {
  const token = getManagerToken();
  if (!token) throw new Error('Нет токена');
  return api({ action: 'manager-me' }, token);
}

export function managerLogout() {
  localStorage.removeItem(MANAGER_TOKEN_KEY);
}

export async function getManagers(): Promise<{ managers: Manager[] }> {
  return api({ action: 'managers-list' }, getAdminToken());
}

export async function addManager(data: {
  name: string; login: string; password: string;
  can_students: boolean; can_content: boolean; can_ai: boolean; can_stats: boolean;
}) {
  return api({ action: 'managers-add', ...data }, getAdminToken());
}

export async function updateManager(data: Partial<Manager> & { id: number; password?: string }) {
  return api({ action: 'managers-update', ...data }, getAdminToken());
}

export async function removeManager(id: number) {
  return api({ action: 'managers-remove', id }, getAdminToken());
}