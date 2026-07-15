const AI_URL = 'https://functions.poehali.dev/75e85bcd-a1d8-49cf-9700-e0da694a7ed8';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';
function getAccessToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(MANAGER_TOKEN_KEY) || ''; }

export interface AiSettings {
  system_prompt: string;
  welcome_message: string;
  forbidden_topics: string;
  temperature: number;
  style: string;
  extra_sources: string;
}

async function aiApi(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(AI_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export async function getAiSettings(): Promise<AiSettings> {
  return aiApi({ action: 'get_settings' });
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  await aiApi({ action: 'save_settings', ...settings }, getAccessToken());
}

export async function sendAiChat(
  message: string,
  history: { role: string; text: string }[],
  student_id?: number | null,
  student_name?: string
) {
  return aiApi({ action: 'chat', message, history, student_id: student_id ?? null, student_name: student_name || '' });
}