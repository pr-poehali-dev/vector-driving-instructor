const CABINET_URL = 'https://functions.poehali.dev/66bbf973-0e6d-4c92-8425-e0ced94ff040';
const TOKEN_KEY = 'vector_student_token';
const ADMIN_TOKEN_KEY = 'vector_admin_token';
const MANAGER_TOKEN_KEY = 'vector_manager_token';

function getStudentToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function getAdminOrManagerToken() {
  const admin = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  const manager = localStorage.getItem(MANAGER_TOKEN_KEY) || '';
  if (window.location.pathname.startsWith('/manager')) return manager || admin;
  return admin || manager;
}

async function api(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;
  const res = await fetch(CABINET_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export interface StudentProfile {
  id: number;
  name: string;
  login: string;
  study_category: string;
  group_name: string;
  study_status: string;
  study_start_date: string | null;
  created_at: string;
  access_until: string | null;
}

export interface DashboardData {
  student: StudentProfile;
  pdd_progress: {
    total_topics: number;
    completed_topics: number;
    percent: number;
    last_topic: { id: number; title: string; category_label: string; category_id: number } | null;
  };
  tests: {
    tests_done: number;
    avg_score_percent: number;
    last_result: { correct_count: number; total_questions: number; finished_at: string } | null;
  };
  mistakes_count: number;
  unread_notifications: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export async function getDashboard(): Promise<DashboardData> {
  return api({ action: 'get_dashboard' }, getStudentToken());
}

export async function getStudentProfile(): Promise<{ student: StudentProfile }> {
  return api({ action: 'get_profile' }, getStudentToken());
}

export async function updateStudentProfile(name: string) {
  return api({ action: 'update_profile', name }, getStudentToken());
}

export async function getNotifications(): Promise<{ notifications: NotificationItem[] }> {
  return api({ action: 'get_notifications' }, getStudentToken());
}

export async function markNotificationRead(id: number) {
  return api({ action: 'mark_notification_read', id }, getStudentToken());
}

export async function getFavorites(item_type?: string) {
  return api({ action: 'get_favorites', item_type }, getStudentToken());
}

export async function addFavorite(item_type: string, item_id: number) {
  return api({ action: 'add_favorite', item_type, item_id }, getStudentToken());
}

export async function removeFavorite(item_type: string, item_id: number) {
  return api({ action: 'remove_favorite', item_type, item_id }, getStudentToken());
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export async function getNotificationsAdmin() {
  return api({ action: 'notifications-list' }, getAdminOrManagerToken());
}

export async function sendNotification(data: {
  title: string; message: string; target_type: 'all' | 'group' | 'student';
  target_student_id?: number; target_group?: string;
}) {
  return api({ action: 'notifications-send', ...data }, getAdminOrManagerToken());
}
