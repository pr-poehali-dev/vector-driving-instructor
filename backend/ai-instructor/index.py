"""
AI-инструктор автошколы Вектор.
POST / { action: "chat", message: "...", history: [{role, text}] }
POST / { action: "get_settings" }
POST / { action: "save_settings", ...fields }
"""
import json
import os
import urllib.request
import urllib.error
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p22961065_vector_driving_instr')


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False),
    }


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def load_settings():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f'SELECT system_prompt, welcome_message, forbidden_topics, temperature, style, extra_sources FROM {SCHEMA}.ai_settings ORDER BY id DESC LIMIT 1')
    row = cur.fetchone()
    conn.close()
    if not row:
        return {}
    return {
        'system_prompt': row[0],
        'welcome_message': row[1],
        'forbidden_topics': row[2],
        'temperature': float(row[3]),
        'style': row[4],
        'extra_sources': row[5],
    }


def load_topics_with_videos():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT t.label, t.tags, m.video_title, m.video_url, m.video_thumb
        FROM {SCHEMA}.chat_topics t
        JOIN {SCHEMA}.chat_messages m ON m.topic_id = t.id
        WHERE m.video_url IS NOT NULL
        ORDER BY t.sort_order, m.sort_order
    ''')
    rows = cur.fetchall()
    conn.close()
    topics = {}
    for label, tags, title, url, thumb in rows:
        if label not in topics:
            # Собираем все ключевые слова: название + теги
            keywords = [w for w in label.lower().split() if len(w) > 2]
            if tags:
                for tag in tags.split(','):
                    t = tag.strip().lower()
                    if t:
                        keywords.append(t)
            topics[label] = {'videos': [], 'keywords': keywords}
        topics[label]['videos'].append({'title': title, 'url': url, 'thumb': thumb or ''})
    return topics


def find_relevant_video(message, topics_with_videos):
    msg_lower = message.lower()
    best_topic = None
    best_score = 0
    for label, data in topics_with_videos.items():
        keywords = data['keywords']
        # Точное совпадение тега даёт 10 очков, частичное — 1
        score = 0
        for kw in keywords:
            if kw in msg_lower:
                score += 10 if kw == msg_lower.strip() else (5 if len(kw) > 4 else 1)
        if score > best_score:
            best_score = score
            best_topic = label
    if best_score > 0 and best_topic:
        return topics_with_videos[best_topic]['videos'][0]
    return None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action', '')

    # ── get_settings ──────────────────────────────────────────────────────────
    if action == 'get_settings':
        settings = load_settings()
        return resp(settings)

    # ── save_settings ─────────────────────────────────────────────────────────
    if action == 'save_settings':
        admin_token = (event.get('headers') or {}).get('X-Auth-Token', '')
        if not admin_token:
            return resp({'error': 'Нет доступа'}, 403)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f'''
            UPDATE {SCHEMA}.ai_settings SET
                system_prompt = %s,
                welcome_message = %s,
                forbidden_topics = %s,
                temperature = %s,
                style = %s,
                extra_sources = %s,
                updated_at = NOW()
            WHERE id = (SELECT id FROM {SCHEMA}.ai_settings ORDER BY id DESC LIMIT 1)
        ''', (
            body.get('system_prompt', ''),
            body.get('welcome_message', ''),
            body.get('forbidden_topics', ''),
            float(body.get('temperature', 0.7)),
            body.get('style', 'friendly'),
            body.get('extra_sources', ''),
        ))
        conn.commit()
        conn.close()
        return resp({'ok': True})

    # ── chat ──────────────────────────────────────────────────────────────────
    if action != 'chat':
        return resp({'error': 'Unknown action'}, 400)

    message = (body.get('message') or '').strip()
    history = body.get('history') or []
    student_id = body.get('student_id') or None
    student_name = (body.get('student_name') or '').strip()

    if not message:
        return resp({'error': 'Сообщение не может быть пустым'}, 400)
    if len(message) > 1000:
        return resp({'error': 'Сообщение слишком длинное'}, 400)

    api_key = os.environ.get('YANDEX_API_KEY', '')
    if not api_key or not api_key.startswith('AQVN'):
        return resp({'error': 'AI-инструктор не настроен. Обратитесь к администратору.'}, 503)

    # Загружаем настройки и видео из БД
    settings = load_settings()
    folder_id = os.environ.get('YANDEX_FOLDER_ID', '')
    system_prompt = settings.get('system_prompt', '')
    temperature = settings.get('temperature', 0.7)
    forbidden = settings.get('forbidden_topics', '')
    extra_sources = settings.get('extra_sources', '')

    # Добавляем запрещённые темы и доп.источники в промпт
    full_prompt = system_prompt
    if forbidden.strip():
        full_prompt += f'\n\nЗАПРЕЩЁННЫЕ ТЕМЫ — категорически не отвечай на:\n{forbidden}'
    if extra_sources.strip():
        full_prompt += f'\n\nДОПОЛНИТЕЛЬНЫЕ ЗНАНИЯ (используй при ответах):\n{extra_sources}'

    # Ищем подходящее видео
    video = None
    try:
        topics_with_videos = load_topics_with_videos()
        video = find_relevant_video(message, topics_with_videos)
    except Exception:
        pass

    # Формируем сообщения для YandexGPT
    messages = [{'role': 'system', 'text': full_prompt}]
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'text': h.get('text', '')})
    messages.append({'role': 'user', 'text': message})

    payload = json.dumps({
        'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
        'completionOptions': {
            'stream': False,
            'temperature': temperature,
            'maxTokens': 512,
        },
        'messages': messages,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Api-Key {api_key}',
            'x-folder-id': folder_id,
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            result = json.loads(r.read().decode('utf-8'))
        answer = result['result']['alternatives'][0]['message']['text']
        # Сохраняем в лог
        try:
            log_conn = get_db()
            log_cur = log_conn.cursor()
            log_cur.execute(
                f"INSERT INTO {SCHEMA}.chat_logs (student_id, student_name, mode, role, message) VALUES (%s, %s, 'ai', 'user', %s)",
                (student_id, student_name, message)
            )
            log_cur.execute(
                f"INSERT INTO {SCHEMA}.chat_logs (student_id, student_name, mode, role, message) VALUES (%s, %s, 'ai', 'bot', %s)",
                (student_id, student_name, answer)
            )
            log_conn.commit()
            log_conn.close()
        except Exception as log_err:
            print(f'Log error: {log_err}')
        return resp({'answer': answer, 'video': video})
    except urllib.error.HTTPError as e:
        err = ''
        try:
            err = e.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        print(f'YandexGPT HTTP error {e.code}: {err[:500]}')
        if e.code == 401:
            return resp({'error': f'Ошибка авторизации (401): {err[:200]}'}, 200)
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного'}, 200)
        return resp({'error': f'Ошибка YandexGPT {e.code}: {err[:300]}'}, 200)
    except Exception as e:
        print(f'YandexGPT exception: {str(e)}')
        return resp({'error': f'Ошибка соединения: {str(e)[:200]}'}, 200)