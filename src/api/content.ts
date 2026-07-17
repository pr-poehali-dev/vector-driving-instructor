const API_URL = 'https://functions.poehali.dev/849f6202-7a80-4e16-b5e9-c559a0f01023';

export interface DBMessage {
  id: number;
  topic_id: number;
  sort_order: number;
  text: string;
  video_title: string | null;
  video_url: string | null;
  video_thumb: string | null;
  image_url: string | null;
  image_caption: string | null;
  options: string[];
}

export interface DBTopic {
  id: number;
  slug: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  tags: string;
  messages: DBMessage[];
}

function adminToken() { return localStorage.getItem('vector_admin_token') || ''; }
function accessToken() {
  const admin = localStorage.getItem('vector_admin_token') || '';
  const manager = localStorage.getItem('vector_manager_token') || '';
  // На странице менеджера в приоритете токен менеджера — в браузере может
  // остаться старый/просроченный токен администратора от прошлого захода в /admin.
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

async function call(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const getTopics = () => call({ action: 'get_topics' });
export const getAllTopicsAdmin = () => call({ action: 'get_all_topics' }, accessToken());

export const saveTopic = (d: Partial<DBTopic>) =>
  call({ action: 'save_topic', ...d }, accessToken());

export const deleteTopic = (id: number) =>
  call({ action: 'delete_topic', id }, accessToken());

export const saveMessage = (d: Partial<DBMessage> & { topic_id?: number }) =>
  call({ action: 'save_message', ...d }, accessToken());

export const deleteMessage = (id: number) =>
  call({ action: 'delete_message', id }, accessToken());

export const reorderTopics = (order: { id: number; sort_order: number }[]) =>
  call({ action: 'reorder_topics', order }, accessToken());

export const reorderMessages = (order: { id: number; sort_order: number }[]) =>
  call({ action: 'reorder_messages', order }, accessToken());

export const getLogsStudents = () =>
  call({ action: 'logs_students' }, accessToken());

export const getLogsHistory = (student_id: number | null, limit = 200) =>
  call({ action: 'logs_history', student_id, limit }, accessToken());

export const getLogsStats = () =>
  call({ action: 'logs_stats' }, accessToken());

export const getLogsOnline = () =>
  call({ action: 'logs_online' }, accessToken());

export const logTopicView = (topic_label: string, student_id?: number | null, student_name?: string) =>
  call({ action: 'log_topic_view', topic_label, student_id: student_id ?? null, student_name: student_name || '' }).catch(() => {});