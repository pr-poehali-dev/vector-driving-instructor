const CONTENT_URL = 'https://functions.poehali.dev/85d0acd8-7f20-430d-9c1e-30408a0c2dd9';

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

async function call(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(CONTENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

function adminToken() {
  return localStorage.getItem('vector_admin_token') || '';
}

export const getTopics = () => call({ action: 'get_topics' });
export const getAllTopicsAdmin = () => call({ action: 'get_all_topics' }, adminToken());

export const saveTopic = (d: Partial<DBTopic>) =>
  call({ action: 'save_topic', ...d }, adminToken());

export const deleteTopic = (id: number) =>
  call({ action: 'delete_topic', id }, adminToken());

export const saveMessage = (d: Partial<DBMessage> & { topic_id?: number }) =>
  call({ action: 'save_message', ...d }, adminToken());

export const deleteMessage = (id: number) =>
  call({ action: 'delete_message', id }, adminToken());

export const reorderTopics = (order: { id: number; sort_order: number }[]) =>
  call({ action: 'reorder_topics', order }, adminToken());

export const reorderMessages = (order: { id: number; sort_order: number }[]) =>
  call({ action: 'reorder_messages', order }, adminToken());