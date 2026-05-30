"""
Управление менеджерами автошколы Вектор (только для администратора). v2
action=list    — список всех менеджеров
action=add     — добавить менеджера
action=update  — обновить менеджера (права, пароль, статус)
action=remove  — деактивировать менеджера
"""
import json
import os
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def resp(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}


def is_admin(cur, token):
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    return cur.fetchone() is not None


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
        if not is_admin(cur, token):
            return resp({'error': 'Доступ запрещён'}, 403)

        # ── Список менеджеров ────────────────────────────────────────────────
        if action == 'list':
            cur.execute(f"""
                SELECT id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at
                FROM {SCHEMA}.managers
                ORDER BY created_at DESC
            """)
            managers = [dict(r) for r in cur.fetchall()]
            return resp({'managers': managers})

        # ── Добавить менеджера ───────────────────────────────────────────────
        if action == 'add':
            name = (body.get('name') or '').strip()
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            if not name or not login or not password:
                return resp({'error': 'Имя, логин и пароль обязательны'}, 400)
            if len(password) < 4:
                return resp({'error': 'Пароль минимум 4 символа'}, 400)

            cur.execute(f"SELECT id FROM {SCHEMA}.managers WHERE login=%s", (login,))
            if cur.fetchone():
                return resp({'error': 'Логин уже занят'}, 400)

            cur.execute(f"""
                INSERT INTO {SCHEMA}.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at
            """, (
                name, login, hash_password(password),
                body.get('can_students', False),
                body.get('can_content', False),
                body.get('can_ai', False),
                body.get('can_stats', False),
            ))
            manager = dict(cur.fetchone())
            conn.commit()
            return resp({'manager': manager})

        # ── Обновить менеджера ───────────────────────────────────────────────
        if action == 'update':
            mgr_id = body.get('id')
            if not mgr_id:
                return resp({'error': 'Не указан id'}, 400)

            fields = []
            values = []

            if 'name' in body:
                fields.append('name=%s')
                values.append(body['name'].strip())
            if 'password' in body and body['password']:
                if len(body['password']) < 4:
                    return resp({'error': 'Пароль минимум 4 символа'}, 400)
                fields.append('password_hash=%s')
                values.append(hash_password(body['password']))
            if 'can_students' in body:
                fields.append('can_students=%s')
                values.append(bool(body['can_students']))
            if 'can_content' in body:
                fields.append('can_content=%s')
                values.append(bool(body['can_content']))
            if 'can_ai' in body:
                fields.append('can_ai=%s')
                values.append(bool(body['can_ai']))
            if 'can_stats' in body:
                fields.append('can_stats=%s')
                values.append(bool(body['can_stats']))
            if 'is_active' in body:
                fields.append('is_active=%s')
                values.append(bool(body['is_active']))

            if not fields:
                return resp({'error': 'Нет данных для обновления'}, 400)

            values.append(mgr_id)
            cur.execute(f"""
                UPDATE {SCHEMA}.managers SET {', '.join(fields)}
                WHERE id=%s
                RETURNING id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at
            """, values)
            row = cur.fetchone()
            conn.commit()
            return resp({'manager': dict(row)})

        # ── Удалить менеджера ────────────────────────────────────────────────
        if action == 'remove':
            mgr_id = body.get('id')
            if not mgr_id:
                return resp({'error': 'Не указан id'}, 400)
            cur.execute(f"UPDATE {SCHEMA}.managers SET is_active=FALSE WHERE id=%s", (mgr_id,))
            conn.commit()
            return resp({'ok': True})

        return resp({'error': 'Unknown action'}, 400)

    finally:
        cur.close()
        conn.close()