const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  work_hours: string;
  is_default: boolean;
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

export const getBranches = (): Promise<{ branches: Branch[] }> => call({ action: 'get_branches' });

export const addBranch = (d: { name: string; address: string; phone: string; work_hours?: string }) =>
  call({ action: 'branches-add', ...d }, adminToken());

export const updateBranch = (d: { id: number; name?: string; address?: string; phone?: string; work_hours?: string }) =>
  call({ action: 'branches-update', ...d }, adminToken());

export const removeBranch = (id: number) =>
  call({ action: 'branches-remove', id }, adminToken());
