"""
Авторизация учеников и администратора автошколы Вектор.
POST /login — вход ученика (login + password)
POST /admin-login — вход администратора (password)
POST /logout — выход
GET /me — проверка сессии ученика
GET /admin-me — проверка сессии администратора
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

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    # Роутинг через поле action в теле запроса (надёжнее чем path в Cloud Functions)
    action = body.get('action', '')

    # Получаем токен из заголовка
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # action=admin-login  (POST)
        if action == 'admin-login':
            password = body.get('password', '')
            admin_pw = os.environ.get('ADMIN_PASSWORD', '')
            if not admin_pw or password != admin_pw:
                return json_resp({'error': 'Неверный пароль'}, 401)
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_sessions (token) VALUES (%s) RETURNING token",
                (new_token,)
            )
            conn.commit()
            return json_resp({'token': new_token, 'role': 'admin'})

        # action=admin-me  (POST или GET)
        if action == 'admin-me':
            if not token:
                return json_resp({'error': 'Нет токена'}, 401)
            cur.execute(
                f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return json_resp({'error': 'Сессия истекла'}, 401)
            return json_resp({'role': 'admin'})

        # action=login — вход ученика
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

        # action=me — проверка сессии ученика
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

        # action=logout
        if action == 'logout':
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return json_resp({'ok': True})

        return json_resp({'error': 'Unknown action'}, 400)

    finally:
        cur.close()
        conn.close()