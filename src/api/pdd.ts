const PDD_URL = 'https://functions.poehali.dev/51002751-ac1c-4807-9174-5287053bf597';
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
  const res = await fetch(PDD_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface PddCategory {
  id: number;
  slug: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active?: boolean;
}

export interface PddTopic {
  id: number;
  category_id: number;
  slug: string;
  title: string;
  content?: string;
  image_url: string | null;
  sort_order: number;
  is_active?: boolean;
  status?: 'not_started' | 'in_progress' | 'completed';
  best_score_percent?: number;
  question_count?: number;
  category_label?: string;
}

export interface PddQuestionAdmin {
  id: number;
  category_id: number | null;
  topic_id: number | null;
  text: string;
  image_url: string | null;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: number;
  sort_order: number;
  is_active: boolean;
}

export interface TestQuestion {
  id: number;
  text: string;
  image_url: string | null;
  options: string[];
}

export interface TestAnswerResult {
  question_id: number;
  text: string;
  image_url: string | null;
  options: string[];
  correct_index: number;
  selected_index: number | null;
  is_correct: boolean;
  explanation: string;
}

export interface TestResultSummary {
  id: number;
  test_type: string;
  total_questions: number;
  correct_count: number;
  passed: boolean | null;
  started_at: string;
  finished_at: string | null;
  topic_title: string | null;
  category_label: string | null;
}

// ─── Public / student ───────────────────────────────────────────────────────
export async function getCategories(): Promise<{ categories: PddCategory[] }> {
  return api({ action: 'get_categories' });
}

export async function getTopics(category_id?: number): Promise<{ topics: PddTopic[] }> {
  return api({ action: 'get_topics', category_id }, getStudentToken());
}

export async function getTopic(topic_id: number): Promise<{ topic: PddTopic }> {
  return api({ action: 'get_topic', topic_id });
}

export async function startTest(params: {
  test_type: 'topic' | 'category' | 'random' | 'mistakes';
  topic_id?: number;
  category_id?: number;
  count?: number;
}): Promise<{ session_id: number; questions: TestQuestion[] }> {
  return api({ action: 'start_test', ...params }, getStudentToken());
}

export async function submitTest(
  session_id: number,
  answers: { question_id: number; selected_index: number | null }[]
): Promise<{ session_id: number; total: number; correct_count: number; passed: boolean; results: TestAnswerResult[] }> {
  return api({ action: 'submit_test', session_id, answers }, getStudentToken());
}

export async function getResults(): Promise<{ results: TestResultSummary[] }> {
  return api({ action: 'get_results' }, getStudentToken());
}

export async function getResultDetail(session_id: number) {
  return api({ action: 'get_result_detail', session_id }, getStudentToken());
}

export async function getMistakes() {
  return api({ action: 'get_mistakes' }, getStudentToken());
}

export async function getProgress(): Promise<{
  categories: { id: number; label: string; total_topics: number; completed_topics: number; percent: number; avg_score: number }[];
  overall_percent: number;
}> {
  return api({ action: 'get_progress' }, getStudentToken());
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export async function getAllCategories(): Promise<{ categories: PddCategory[] }> {
  return api({ action: 'get_all_categories' }, getAdminOrManagerToken());
}

export async function saveCategory(data: Partial<PddCategory> & { label: string }) {
  return api({ action: 'save_category', ...data }, getAdminOrManagerToken());
}

export async function deleteCategory(id: number) {
  return api({ action: 'delete_category', id }, getAdminOrManagerToken());
}

export async function reorderCategories(order: { id: number; sort_order: number }[]) {
  return api({ action: 'reorder_categories', order }, getAdminOrManagerToken());
}

export async function getAllTopicsAdmin(category_id?: number): Promise<{ topics: PddTopic[] }> {
  return api({ action: 'get_all_topics', category_id }, getAdminOrManagerToken());
}

export async function saveTopicAdmin(data: Partial<PddTopic> & { category_id: number; title: string }) {
  return api({ action: 'save_topic', ...data }, getAdminOrManagerToken());
}

export async function deleteTopicAdmin(id: number) {
  return api({ action: 'delete_topic', id }, getAdminOrManagerToken());
}

export async function reorderTopicsAdmin(order: { id: number; sort_order: number }[]) {
  return api({ action: 'reorder_topics', order }, getAdminOrManagerToken());
}

export async function getQuestionsAdmin(params: { topic_id?: number; category_id?: number }): Promise<{ questions: PddQuestionAdmin[] }> {
  return api({ action: 'get_questions', ...params }, getAdminOrManagerToken());
}

export async function saveQuestionAdmin(data: Partial<PddQuestionAdmin> & { text: string; options: string[]; correct_index: number }) {
  return api({ action: 'save_question', ...data }, getAdminOrManagerToken());
}

export async function deleteQuestionAdmin(id: number) {
  return api({ action: 'delete_question', id }, getAdminOrManagerToken());
}
