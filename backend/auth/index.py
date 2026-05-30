"""
Авторизация учеников, администратора и менеджеров автошколы Вектор. v3
action=admin-login    — вход администратора (password)
action=admin-me       — проверка сессии администратора
action=manager-login  — вход менеджера (login + password)
action=manager-me     — проверка сессии менеджера + права
action=login          — вход ученика
action=me             — проверка сессии ученика
action=logout         — выход
"""
import json
import os
import secrets
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def json_resp(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}


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
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # ── Вход администратора ──────────────────────────────────────────────
        if action == 'admin-login':
            password = (body.get('password', '') or '').strip()
            admin_pw = (os.environ.get('ADMIN_PASSWORD', '') or '').strip()
            # Проверяем обычный пароль
            pw_match = admin_pw and password == admin_pw
            # Проверяем сохранённый пароль или одноразовый reset-токен из БД
            reset_match = False
            if not pw_match and password:
                cur.execute(
                    f"SELECT id, token FROM {SCHEMA}.admin_reset_tokens WHERE token=%s AND expires_at > NOW()",
                    (password,)
                )
                row = cur.fetchone()
                if not row:
                    # Проверяем сохранённый пароль через PWD: префикс
                    cur.execute(
                        f"SELECT id FROM {SCHEMA}.admin_reset_tokens WHERE token=%s AND expires_at > NOW()",
                        (f'PWD:{password}',)
                    )
                    row = cur.fetchone()
                if row:
                    token_val = row['token'] if row else ''
                    # Одноразовые (без PWD:) — удаляем после использования
                    if not token_val.startswith('PWD:'):
                        cur.execute(f"UPDATE {SCHEMA}.admin_reset_tokens SET expires_at=NOW() WHERE token=%s", (token_val,))
                    reset_match = True
            if not pw_match and not reset_match:
                return json_resp({'error': 'Неверный пароль'}, 401)
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_sessions (token) VALUES (%s) RETURNING token",
                (new_token,)
            )
            conn.commit()
            return json_resp({'token': new_token, 'role': 'admin'})

        # ── Смена пароля администратора (только с активной сессией) ────────────
        if action == 'admin-set-password':
            if not token:
                return json_resp({'error': 'Нет токена'}, 401)
            cur.execute(
                f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()",
                (token,)
            )
            if not cur.fetchone():
                return json_resp({'error': 'Сессия истекла'}, 401)
            new_password = (body.get('new_password', '') or '').strip()
            if len(new_password) < 6:
                return json_resp({'error': 'Пароль минимум 6 символов'}, 400)
            # Сохраняем в БД как fallback (основной приоритет — секрет)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.admin_reset_tokens (token, expires_at)
                    VALUES (%s, NOW() + INTERVAL '10 years')
                    ON CONFLICT (token) DO UPDATE SET expires_at = NOW() + INTERVAL '10 years'""",
                (f'PWD:{new_password}',)
            )
            conn.commit()
            return json_resp({'ok': True, 'hint': 'Пароль сохранён. Также обновите секрет ADMIN_PASSWORD в Ядро → Секреты.'})

        # ── Проверка сессии администратора ───────────────────────────────────
        if action == 'admin-me':
            if not token:
                return json_resp({'error': 'Нет токена'}, 401)
            cur.execute(
                f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()",
                (token,)
            )
            if not cur.fetchone():
                return json_resp({'error': 'Сессия истекла'}, 401)
            return json_resp({'role': 'admin'})

        # ── Вход менеджера ───────────────────────────────────────────────────
        if action == 'manager-login':
            login = body.get('login', '').strip().lower()
            password = body.get('password', '')
            if not login or not password:
                return json_resp({'error': 'Введите логин и пароль'}, 400)
            pw_hash = hash_password(password)
            cur.execute(
                f"""SELECT id, name, can_students, can_content, can_ai, can_stats
                    FROM {SCHEMA}.managers
                    WHERE login=%s AND password_hash=%s AND is_active=TRUE""",
                (login, pw_hash)
            )
            mgr = cur.fetchone()
            if not mgr:
                return json_resp({'error': 'Неверный логин или пароль'}, 401)
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.manager_sessions (manager_id, token) VALUES (%s, %s)",
                (mgr['id'], new_token)
            )
            conn.commit()
            return json_resp({
                'token': new_token,
                'role': 'manager',
                'name': mgr['name'],
                'permissions': {
                    'students': mgr['can_students'],
                    'content': mgr['can_content'],
                    'ai': mgr['can_ai'],
                    'stats': mgr['can_stats'],
                }
            })

        # ── Проверка сессии менеджера ────────────────────────────────────────
        if action == 'manager-me':
            if not token:
                return json_resp({'error': 'Нет токена'}, 401)
            cur.execute(
                f"""SELECT m.id, m.name, m.can_students, m.can_content, m.can_ai, m.can_stats
                    FROM {SCHEMA}.manager_sessions ms
                    JOIN {SCHEMA}.managers m ON m.id = ms.manager_id
                    WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
                (token,)
            )
            mgr = cur.fetchone()
            if not mgr:
                return json_resp({'error': 'Сессия истекла'}, 401)
            return json_resp({
                'role': 'manager',
                'name': mgr['name'],
                'permissions': {
                    'students': mgr['can_students'],
                    'content': mgr['can_content'],
                    'ai': mgr['can_ai'],
                    'stats': mgr['can_stats'],
                }
            })

        # ── Вход ученика ─────────────────────────────────────────────────────
        if action == 'login':
            login = body.get('login', '').strip().lower()
            password = body.get('password', '')
            if not login or not password:
                return json_resp({'error': 'Введите логин и пароль'}, 400)
            pw_hash = hash_password(password)
            cur.execute(
                f"SELECT id, name FROM {SCHEMA}.students WHERE login=%s AND password_hash=%s AND is_active=TRUE",
                (login, pw_hash)
            )
            student = cur.fetchone()
            if not student:
                return json_resp({'error': 'Неверный логин или пароль'}, 401)
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (student_id, token) VALUES (%s, %s) RETURNING token",
                (student['id'], new_token)
            )
            conn.commit()
            return json_resp({'token': new_token, 'name': student['name'], 'role': 'student'})

        # ── Проверка сессии ученика ──────────────────────────────────────────
        if action == 'me':
            if not token:
                return json_resp({'error': 'Нет токена'}, 401)
            cur.execute(
                f"""SELECT s.name, s.id FROM {SCHEMA}.sessions sess
                    JOIN {SCHEMA}.students s ON s.id = sess.student_id
                    WHERE sess.token=%s AND sess.expires_at > NOW() AND s.is_active=TRUE""",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return json_resp({'error': 'Сессия истекла'}, 401)
            return json_resp({'name': row['name'], 'id': row['id'], 'role': 'student'})

        # ── Выход ────────────────────────────────────────────────────────────
        if action == 'logout':
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                cur.execute(f"UPDATE {SCHEMA}.manager_sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return json_resp({'ok': True})

        return json_resp({'error': 'Unknown action'}, 400)

    finally:
        cur.close()
        conn.close()