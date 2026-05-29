"""
Управление учениками автошколы Вектор (только для администратора).
GET  /  — список всех учеников
POST /  — добавить ученика {name, login, password, notes}
PUT  /  — обновить ученика {id, name, is_active, notes, password?}
"""
import json
import os
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def json_resp(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def check_admin(cur, token: str) -> bool:
    if not token:
        return False
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    return cur.fetchone() is not None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if not check_admin(cur, token):
            return json_resp({'error': 'Доступ запрещён'}, 403)

        # action=list — список учеников
        if action == 'list':
            cur.execute(
                f"SELECT id, name, login, is_active, notes, created_at FROM {SCHEMA}.students ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            return json_resp({'students': [dict(r) for r in rows]})

        # action=add — добавить ученика
        if action == 'add':
            name = body.get('name', '').strip()
            login = body.get('login', '').strip().lower()
            password = body.get('password', '').strip()
            notes = body.get('notes', '').strip()

            if not name or not login or not password:
                return json_resp({'error': 'Имя, логин и пароль обязательны'}, 400)
            if len(password) < 4:
                return json_resp({'error': 'Пароль минимум 4 символа'}, 400)

            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.students (name, login, password_hash, notes) VALUES (%s, %s, %s, %s) RETURNING id, name, login, is_active, notes, created_at",
                (name, login, pw_hash, notes)
            )
            row = cur.fetchone()
            conn.commit()
            return json_resp({'student': dict(row)}, 201)

        # action=update — обновить ученика
        if action == 'update':
            student_id = body.get('id')
            if not student_id:
                return json_resp({'error': 'Не указан id'}, 400)

            fields = []
            values = []

            if 'name' in body:
                fields.append('name=%s')
                values.append(body['name'].strip())
            if 'is_active' in body:
                fields.append('is_active=%s')
                values.append(bool(body['is_active']))
            if 'notes' in body:
                fields.append('notes=%s')
                values.append(body['notes'])
            if body.get('password'):
                fields.append('password_hash=%s')
                values.append(hash_password(body['password']))

            if not fields:
                return json_resp({'error': 'Нет данных для обновления'}, 400)

            values.append(student_id)
            cur.execute(
                f"UPDATE {SCHEMA}.students SET {', '.join(fields)} WHERE id=%s RETURNING id, name, login, is_active, notes, created_at",
                values
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return json_resp({'error': 'Ученик не найден'}, 404)
            return json_resp({'student': dict(row)})

        return json_resp({'error': 'Unknown action'}, 400)

    finally:
        cur.close()
        conn.close()