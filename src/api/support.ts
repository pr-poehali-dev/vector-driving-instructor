const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';

function getAccessToken() {
  const admin = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  const manager = localStorage.getItem(MANAGER_TOKEN_KEY) || '';
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

export interface SupportTicket {
  id: number;
  student_id: number | null;
  student_name: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  admin_note: string;
  created_at: string;
  updated_at: string;
}

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export async function createSupportTicket(message: string, student_id?: number | null, student_name?: string) {
  return api({ action: 'support-create', message, student_id: student_id ?? null, student_name: student_name || '' });
}

export async function getSupportTickets(status?: string): Promise<{ tickets: SupportTicket[] }> {
  return api({ action: 'support-list', status: status || 'all' }, getAccessToken());
}

export async function updateSupportTicket(id: number, data: { status?: string; admin_note?: string }) {
  return api({ action: 'support-update', id, ...data }, getAccessToken());
}
