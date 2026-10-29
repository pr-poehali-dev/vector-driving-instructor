export const HOME_API = 'https://functions.poehali.dev/ff150851-437d-4482-9100-86f56d45bea8';

export interface FleetItem { id: number; group: string; title: string; subtitle: string; image_url: string; wide: boolean }
export interface MasterItem { id: number; name: string; role: string; years: string; quote: string; tags: string[]; photo_url: string; featured: boolean }
export interface VideoItem { id: number; title: string; caption: string; video_url: string; poster_url: string; format: 'wide' | 'vertical' }
export interface FaqItem { id: number; question: string; answer: string }
export interface LocationItem { id: number; name: string; address: string; kind: string; hours: string; phone: string; lat: number; lng: number }
export interface DemoSettings {
  video_url: string; video_title: string; video_caption: string;
  q_label: string; q_tag: string; question: string; answers: string[];
}
export interface MapSettings { key?: string }

export interface HomeContent {
  items: { fleet: FleetItem[]; masters: MasterItem[]; videos: VideoItem[]; faq: FaqItem[]; locations: LocationItem[] };
  settings: { demo?: DemoSettings; map?: MapSettings };
}

export type Section = 'fleet' | 'masters' | 'videos' | 'faq' | 'locations';

export interface AdminItem<T> { id: number; is_active: boolean; data: T }
export interface HomeAdminContent {
  items: {
    fleet: AdminItem<Omit<FleetItem, 'id'>>[];
    masters: AdminItem<Omit<MasterItem, 'id'>>[];
    videos: AdminItem<Omit<VideoItem, 'id'>>[];
    faq: AdminItem<Omit<FaqItem, 'id'>>[];
    locations: AdminItem<Omit<LocationItem, 'id'>>[];
  };
  settings: { demo?: DemoSettings; map?: MapSettings };
}

export function mediaUrl(value: string): string {
  if (!value) return '';
  if (value.startsWith('reg45:')) return `${HOME_API}?action=video&key=${encodeURIComponent(value.slice(6))}`;
  return value;
}

export async function fetchHome(): Promise<HomeContent | null> {
  try {
    const res = await fetch(HOME_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_home' }),
    });
    if (!res.ok) return null;
    return (await res.json()) as HomeContent;
  } catch {
    return null;
  }
}

function accessToken() {
  const admin = localStorage.getItem('vector_admin_token') || '';
  const manager = localStorage.getItem('vector_manager_token') || '';
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

async function call(body: object) {
  const res = await fetch(HOME_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': accessToken() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export type LeadStatus = 'new' | 'in_work' | 'done' | 'rejected';
export interface Lead {
  id: number; name: string; phone: string; branch: string; category: string;
  status: LeadStatus; note: string; created_at: string;
}
export const getLeads = (status?: LeadStatus): Promise<{ leads: Lead[]; new_count: number }> =>
  call({ action: 'leads_list', status });
export const updateLead = (id: number, d: { status?: LeadStatus; note?: string }) =>
  call({ action: 'lead_update', id, ...d });
export const deleteLead = (id: number) => call({ action: 'lead_delete', id });

export const getHomeAdmin = (): Promise<HomeAdminContent> => call({ action: 'get_home_admin' });
export const saveHomeItem = (section: Section, data: object, id?: number, is_active?: boolean) =>
  call({ action: 'save_item', section, data, id, is_active });
export const deleteHomeItem = (id: number) => call({ action: 'delete_item', id });
export const reorderHomeItems = (order: number[]) => call({ action: 'reorder_items', order });
export const saveHomeSetting = (key: 'demo' | 'map', value: object) => call({ action: 'save_setting', key, value });

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Не удалось прочитать файл'));
    r.readAsDataURL(blob);
  });
}

async function shrinkImage(file: File, maxSide = 1800): Promise<{ blob: Blob; name: string }> {
  if (file.type === 'image/png' && file.size < 1.5 * 1024 * 1024) return { blob: file, name: file.name };
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Не удалось обработать фото'))), 'image/jpeg', 0.86)
  );
  return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' };
}

export async function uploadHomeImage(file: File): Promise<string> {
  const { blob, name } = await shrinkImage(file);
  const data = await call({ action: 'upload_image', file_name: name, content_base64: await fileToBase64(blob) });
  return data.url as string;
}

export async function uploadHomeVideo(file: File, onProgress: (percent: number) => void): Promise<string> {
  const pre = await call({ action: 'presign_video', file_name: file.name });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', pre.upload_url);
    xhr.setRequestHeader('Content-Type', pre.content_type);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Загрузка не удалась (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Нет соединения при загрузке видео'));
    xhr.send(file);
  });
  return pre.value as string;
}