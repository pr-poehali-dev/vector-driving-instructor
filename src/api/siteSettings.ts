const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; }

export interface SiteSettings {
  chat_topics_enabled: boolean;
  chat_ai_enabled: boolean;
  maintenance_mode: boolean;
}

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return api({ action: 'get_site_settings' });
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  return api({ action: 'save_site_settings', ...settings }, getAdminToken());
}
