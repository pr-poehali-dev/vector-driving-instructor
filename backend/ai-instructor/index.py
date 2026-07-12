"""
AI-инструктор автошколы Вектор.
POST / { action: "chat", message: "...", history: [{role, text}] }
POST / { action: "get_settings" }
POST / { action: "save_settings", ...fields }
"""
import json
import os
import re
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


STOPWORDS = {
    'как', 'что', 'это', 'для', 'при', 'над', 'под', 'мне', 'мой', 'моя',
    'мои', 'все', 'всё', 'весь', 'вся', 'про', 'или', 'его', 'ему', 'она',
    'они', 'вот', 'уже', 'еще', 'ещё', 'там', 'тут', 'где', 'если', 'чтобы',
    'можно', 'нужно', 'надо', 'такое', 'такой', 'такая', 'такие', 'есть',
    'был', 'была', 'были', 'быть', 'меня', 'тебя', 'себя', 'нам', 'вам',
    'им', 'ним', 'ней', 'него', 'покажи', 'покажите', 'видео', 'посмотреть',
    'посмотри', 'хочу', 'дайте', 'дай', 'ролик', 'урок', 'манёвр', 'маневр',
    'манёвры', 'маневры', 'улице', 'улица', 'улицу',
}

ALL_MARKERS = {'все', 'всё', 'весь', 'вся', 'всех', 'каждое', 'каждый', 'любые', 'разные'}


def normalize_word(w):
    return re.sub(r'[^a-zа-яё0-9]', '', w.lower())


def word_stem(w):
    # Простой стеммер для русского: отбрасываем последние буквы у длинных слов,
    # чтобы сопоставлять разные падежи/формы (чернореченское / чернореченской / чернореченская)
    if len(w) > 7:
        return w[:6]
    if len(w) > 4:
        return w[:4]
    return w


def load_all_videos():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT m.video_title, m.video_url, m.video_thumb, m.text, t.label, t.tags
        FROM {SCHEMA}.chat_messages m
        JOIN {SCHEMA}.chat_topics t ON m.topic_id = t.id
        WHERE m.video_url IS NOT NULL
        ORDER BY t.sort_order, m.sort_order
    ''')
    rows = cur.fetchall()
    conn.close()
    videos = []
    for title, url, thumb, text, label, tags in rows:
        title_words = [normalize_word(w) for w in (title or '').split()]
        title_words = [w for w in title_words if len(w) > 2]
        tag_words = []
        if tags:
            tag_words = [normalize_word(t) for t in tags.split(',') if t.strip()]
        videos.append({
            'title': title or '',
            'url': url,
            'thumb': thumb or '',
            'text': (text or '').strip(),
            'title_stems': {word_stem(w) for w in title_words},
            'tag_stems': {word_stem(w) for w in tag_words if w},
        })
    return videos


def call_yandex_gpt(api_key, folder_id, messages, temperature=0.3, max_tokens=200, timeout=20):
    payload = json.dumps({
        'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
        'completionOptions': {
            'stream': False,
            'temperature': temperature,
            'maxTokens': max_tokens,
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
    with urllib.request.urlopen(req, timeout=timeout) as r:
        result = json.loads(r.read().decode('utf-8'))
    return result['result']['alternatives'][0]['message']['text'].strip()


def generate_video_description(title, api_key, folder_id):
    if not title:
        return ''
    try:
        prompt = (
            'Ты — инструктор по вождению автошколы. У тебя есть видеоурок с названием: '
            f'"{title}". Опиши в 1-2 коротких предложениях, что показано на этом видео и '
            'какой манёвр или ситуацию на дороге оно разбирает. Пиши сразу описание, без вступлений и оговорок.'
        )
        return call_yandex_gpt(
            api_key, folder_id,
            [{'role': 'user', 'text': prompt}],
            temperature=0.3, max_tokens=150, timeout=15
        )
    except Exception:
        return ''


def find_relevant_videos(message, videos):
    msg_lower = message.lower()
    msg_words = [normalize_word(w) for w in re.findall(r'[a-zа-яё0-9]+', msg_lower)]
    msg_words = [w for w in msg_words if len(w) > 2 and w not in STOPWORDS]
    msg_stems = {word_stem(w) for w in msg_words}

    ask_all = any(w in ALL_MARKERS for w in msg_lower.split())

    scored = []
    for v in videos:
        score = 0
        # Совпадение по названию видео — основной сигнал
        score += 10 * len(msg_stems & v['title_stems'])
        # Совпадение по тегам темы — вспомогательный сигнал
        score += 3 * len(msg_stems & v['tag_stems'])
        if score > 0:
            scored.append((score, v))

    if not scored:
        return []

    scored.sort(key=lambda x: -x[0])

    seen = set()
    result = []
    if ask_all:
        # Показываем все видео, совпавшие хотя бы по одному ключевому слову
        for score, v in scored:
            if v['url'] in seen:
                continue
            seen.add(v['url'])
            result.append({'title': v['title'], 'url': v['url'], 'thumb': v['thumb'], 'text': v['text']})
    else:
        # Показываем только наиболее подходящее конкретное видео
        top_score = scored[0][0]
        for score, v in scored:
            if score != top_score or v['url'] in seen:
                continue
            seen.add(v['url'])
            result.append({'title': v['title'], 'url': v['url'], 'thumb': v['thumb'], 'text': v['text']})
    return result


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

    # Ищем подходящие видео (по названию видео, а не по теме целиком)
    videos = []
    try:
        all_videos = load_all_videos()
        videos = find_relevant_videos(message, all_videos)
    except Exception:
        pass

    def save_log(user_msg, bot_msg):
        try:
            log_conn = get_db()
            log_cur = log_conn.cursor()
            log_cur.execute(
                f"INSERT INTO {SCHEMA}.chat_logs (student_id, student_name, mode, role, message) VALUES (%s, %s, 'ai', 'user', %s)",
                (student_id, student_name, user_msg)
            )
            log_cur.execute(
                f"INSERT INTO {SCHEMA}.chat_logs (student_id, student_name, mode, role, message) VALUES (%s, %s, 'ai', 'bot', %s)",
                (student_id, student_name, bot_msg)
            )
            log_conn.commit()
            log_conn.close()
        except Exception as log_err:
            print(f'Log error: {log_err}')

    # Если найдены конкретные видео по названию/тегам — отвечаем на основе готового
    # описания темы (или коротко генерируем его по названию), не спрашивая общий чат-ответ у LLM.
    # Это исключает ситуации, когда модель одновременно находит видео и пишет отказ не по теме.
    # Каждое видео получает своё собственное описание (поле description), чтобы на фронте
    # текст шёл сразу перед соответствующим видео, а не всей пачкой сверху.
    if videos:
        for v in videos:
            desc = v.get('text') or ''
            if not desc and v.get('title'):
                desc = generate_video_description(v['title'], api_key, folder_id)
            v['description'] = desc
            v.pop('text', None)
        if len(videos) > 1:
            answer = 'Вот все манёвры, которые нашлись по вашему запросу:'
        else:
            answer = ''
        log_text = answer + '\n\n' + '\n\n'.join(f"{v['title']}: {v['description']}" for v in videos)
        save_log(message, log_text)
        return resp({'answer': answer, 'video': videos[0], 'videos': videos})

    # Формируем сообщения для YandexGPT
    messages = [{'role': 'system', 'text': full_prompt}]
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'text': h.get('text', '')})
    messages.append({'role': 'user', 'text': message})

    try:
        answer = call_yandex_gpt(api_key, folder_id, messages, temperature=temperature, max_tokens=512, timeout=25)
        save_log(message, answer)
        return resp({'answer': answer, 'video': None, 'videos': []})
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