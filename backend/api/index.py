"""
Единая API-функция автошколы Вектор.
Объединяет: auth, students, managers, content, logs.

=== AUTH ===
action=admin-login         password
action=admin-me
action=admin-set-password  new_password
action=manager-login       login, password
action=manager-me
action=login               login, password
action=me
action=logout

=== STUDENTS ===
action=students-list
action=students-add        name, login, password, notes
action=students-update     id, name?, is_active?, notes?, password?

=== MANAGERS ===
action=managers-list
action=managers-add        name, login, password, can_students, can_content, can_ai, can_stats
action=managers-update     id, name?, password?, can_*, is_active?
action=managers-remove     id

=== CONTENT ===
action=get_topics          (публичный)
action=get_all_topics      (admin)
action=save_topic          id?, label, icon, is_active, sort_order, tags
action=delete_topic        id
action=save_message        id?, topic_id, text, video_*, image_*, options, sort_order
action=delete_message      id
action=reorder_topics      order=[{id,sort_order}]
action=reorder_messages    order=[{id,sort_order}]

=== LOGS ===
action=logs_students
action=logs_history        student_id, limit?
action=logs_stats
"""
import json
import os
import re
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
import secrets

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_pw(p):
    return hashlib.sha256(p.encode()).hexdigest()

def make_token():
    return secrets.token_hex(32)

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return ok({'error': msg}, status)

def is_admin(cur, token):
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    return cur.fetchone() is not None

def get_manager(cur, token):
    if not token:
        return None
    cur.execute(
        f"""SELECT m.id, m.can_students, m.can_content, m.can_ai, m.can_stats
            FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    return cur.fetchone()

def is_admin_or_manager(cur, token, perm=None):
    if is_admin(cur, token):
        return True
    mgr = get_manager(cur, token)
    if mgr and perm:
        return bool(mgr[perm])
    return mgr is not None


# ── Topics helpers ────────────────────────────────────────────────────────────

def fetch_topics(cur, only_active=True):
    where = "WHERE is_active=TRUE" if only_active else ""
    cur.execute(f"SELECT id, slug, label, icon, sort_order, is_active, tags FROM {SCHEMA}.chat_topics {where} ORDER BY sort_order, id")
    topics = [dict(r) for r in cur.fetchall()]
    for t in topics:
        cur.execute(
            f"""SELECT id, sort_order, text, video_title, video_url, video_thumb,
                       image_url, image_caption, options, is_360
                FROM {SCHEMA}.chat_messages WHERE topic_id=%s ORDER BY sort_order, id""",
            (t['id'],)
        )
        msgs = []
        for m in cur.fetchall():
            msg = dict(m)
            msg['options'] = msg['options'] if msg['options'] else []
            msgs.append(msg)
        t['messages'] = msgs
    return topics


# ── Main handler ──────────────────────────────────────────────────────────────

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

        # ══════════════════════════════════════════════════════════════════════
        # AUTH
        # ══════════════════════════════════════════════════════════════════════

        if action == 'admin-login':
            password = (body.get('password') or '').strip()
            if not password:
                return err('Введите пароль')
            # 1. Секрет
            admin_pw = (os.environ.get('ADMIN_PASSWORD') or '').strip()
            if admin_pw and password == admin_pw:
                t = make_token()
                cur.execute(f"INSERT INTO {SCHEMA}.admin_sessions (token) VALUES (%s)", (t,))
                conn.commit()
                return ok({'token': t, 'role': 'admin'})
            # 2. Пароль из БД
            cur.execute(f"SELECT password_hash FROM {SCHEMA}.admin_passwords ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            if row and row['password_hash'] == hash_pw(password):
                t = make_token()
                cur.execute(f"INSERT INTO {SCHEMA}.admin_sessions (token) VALUES (%s)", (t,))
                conn.commit()
                return ok({'token': t, 'role': 'admin'})
            return err('Неверный пароль', 401)

        if action == 'admin-me':
            if not is_admin(cur, token):
                return err('Нет доступа', 401)
            return ok({'role': 'admin'})

        if action == 'admin-set-password':
            if not is_admin(cur, token):
                return err('Нет доступа', 401)
            new_pw = (body.get('new_password') or '').strip()
            if len(new_pw) < 6:
                return err('Пароль минимум 6 символов')
            cur.execute(f"INSERT INTO {SCHEMA}.admin_passwords (password_hash) VALUES (%s)", (hash_pw(new_pw),))
            conn.commit()
            return ok({'ok': True})

        if action == 'manager-login':
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            if not login or not password:
                return err('Введите логин и пароль')
            cur.execute(
                f"""SELECT id, name, can_students, can_content, can_ai, can_stats
                    FROM {SCHEMA}.managers WHERE login=%s AND password_hash=%s AND is_active=TRUE""",
                (login, hash_pw(password))
            )
            mgr = cur.fetchone()
            if not mgr:
                return err('Неверный логин или пароль', 401)
            t = make_token()
            cur.execute(f"INSERT INTO {SCHEMA}.manager_sessions (manager_id, token) VALUES (%s, %s)", (mgr['id'], t))
            conn.commit()
            return ok({'token': t, 'role': 'manager', 'name': mgr['name'],
                       'permissions': {'students': mgr['can_students'], 'content': mgr['can_content'],
                                       'ai': mgr['can_ai'], 'stats': mgr['can_stats']}})

        if action == 'manager-me':
            if not token:
                return err('Нет токена', 401)
            cur.execute(
                f"""SELECT m.name, m.can_students, m.can_content, m.can_ai, m.can_stats
                    FROM {SCHEMA}.manager_sessions ms
                    JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
                    WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
                (token,)
            )
            mgr = cur.fetchone()
            if not mgr:
                return err('Сессия истекла', 401)
            return ok({'role': 'manager', 'name': mgr['name'],
                       'permissions': {'students': mgr['can_students'], 'content': mgr['can_content'],
                                       'ai': mgr['can_ai'], 'stats': mgr['can_stats']}})

        if action == 'login':
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            if not login or not password:
                return err('Введите логин и пароль')
            cur.execute(
                f"SELECT id, name FROM {SCHEMA}.students WHERE login=%s AND password_hash=%s AND is_active=TRUE",
                (login, hash_pw(password))
            )
            s = cur.fetchone()
            if not s:
                return err('Неверный логин или пароль', 401)
            t = make_token()
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (student_id, token) VALUES (%s, %s)", (s['id'], t))
            conn.commit()
            return ok({'token': t, 'name': s['name'], 'role': 'student'})

        if action == 'me':
            if not token:
                return err('Нет токена', 401)
            cur.execute(
                f"""SELECT s.name, s.id FROM {SCHEMA}.sessions sess
                    JOIN {SCHEMA}.students s ON s.id=sess.student_id
                    WHERE sess.token=%s AND sess.expires_at > NOW() AND s.is_active=TRUE""",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            return ok({'name': row['name'], 'id': row['id'], 'role': 'student'})

        if action == 'logout':
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                cur.execute(f"UPDATE {SCHEMA}.manager_sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════════
        # STUDENTS
        # ══════════════════════════════════════════════════════════════════════

        if action == 'students-list':
            if not is_admin_or_manager(cur, token, 'can_students'):
                return err('Доступ запрещён', 403)
            cur.execute(f"SELECT id, name, login, is_active, notes, created_at FROM {SCHEMA}.students ORDER BY created_at DESC")
            return ok({'students': [dict(r) for r in cur.fetchall()]})

        if action == 'students-add':
            if not is_admin_or_manager(cur, token, 'can_students'):
                return err('Доступ запрещён', 403)
            name = (body.get('name') or '').strip()
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            notes = (body.get('notes') or '').strip()
            if not name or not login or not password:
                return err('Имя, логин и пароль обязательны')
            if len(password) < 4:
                return err('Пароль минимум 4 символа')
            cur.execute(
                f"INSERT INTO {SCHEMA}.students (name, login, password_hash, notes) VALUES (%s,%s,%s,%s) RETURNING id, name, login, is_active, notes, created_at",
                (name, login, hash_pw(password), notes)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'student': dict(row)}, 201)

        if action == 'students-update':
            if not is_admin_or_manager(cur, token, 'can_students'):
                return err('Доступ запрещён', 403)
            sid = body.get('id')
            if not sid:
                return err('Не указан id')
            fields, values = [], []
            for f in ['name', 'is_active', 'notes']:
                if f in body:
                    fields.append(f'{f}=%s')
                    values.append(bool(body[f]) if f == 'is_active' else body[f])
            if body.get('password'):
                fields.append('password_hash=%s')
                values.append(hash_pw(body['password']))
            if not fields:
                return err('Нет данных')
            values.append(sid)
            cur.execute(
                f"UPDATE {SCHEMA}.students SET {', '.join(fields)} WHERE id=%s RETURNING id, name, login, is_active, notes, created_at",
                values
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err('Не найден', 404)
            return ok({'student': dict(row)})

        # ══════════════════════════════════════════════════════════════════════
        # MANAGERS
        # ══════════════════════════════════════════════════════════════════════

        if action == 'managers-list':
            if not is_admin(cur, token):
                return err('Доступ запрещён', 403)
            cur.execute(f"SELECT id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at FROM {SCHEMA}.managers ORDER BY created_at DESC")
            return ok({'managers': [dict(r) for r in cur.fetchall()]})

        if action == 'managers-add':
            if not is_admin(cur, token):
                return err('Доступ запрещён', 403)
            name = (body.get('name') or '').strip()
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            if not name or not login or not password:
                return err('Имя, логин и пароль обязательны')
            if len(password) < 4:
                return err('Пароль минимум 4 символа')
            cur.execute(f"SELECT id FROM {SCHEMA}.managers WHERE login=%s", (login,))
            if cur.fetchone():
                return err('Логин уже занят')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.managers (name, login, password_hash, can_students, can_content, can_ai, can_stats)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at""",
                (name, login, hash_pw(password),
                 bool(body.get('can_students')), bool(body.get('can_content')),
                 bool(body.get('can_ai')), bool(body.get('can_stats')))
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'manager': dict(row)})

        if action == 'managers-update':
            if not is_admin(cur, token):
                return err('Доступ запрещён', 403)
            mid = body.get('id')
            if not mid:
                return err('Не указан id')
            fields, values = [], []
            for f in ['name', 'can_students', 'can_content', 'can_ai', 'can_stats', 'is_active']:
                if f in body:
                    fields.append(f'{f}=%s')
                    values.append(bool(body[f]) if f != 'name' else body[f].strip())
            if body.get('password'):
                if len(body['password']) < 4:
                    return err('Пароль минимум 4 символа')
                fields.append('password_hash=%s')
                values.append(hash_pw(body['password']))
            if not fields:
                return err('Нет данных')
            values.append(mid)
            cur.execute(
                f"UPDATE {SCHEMA}.managers SET {', '.join(fields)} WHERE id=%s RETURNING id, name, login, can_students, can_content, can_ai, can_stats, is_active, created_at",
                values
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'manager': dict(row)})

        if action == 'managers-remove':
            if not is_admin(cur, token):
                return err('Доступ запрещён', 403)
            mid = body.get('id')
            if not mid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.managers SET is_active=FALSE WHERE id=%s", (mid,))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════════
        # CONTENT
        # ══════════════════════════════════════════════════════════════════════

        if action == 'get_topics':
            return ok({'topics': fetch_topics(cur, only_active=True)})

        if action == 'get_all_topics':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            return ok({'topics': fetch_topics(cur, only_active=False)})

        if action == 'save_topic':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            tid = body.get('id')
            label = (body.get('label') or '').strip()
            if not label:
                return err('Название темы обязательно')
            icon = (body.get('icon') or 'BookOpen').strip()
            is_active = body.get('is_active', True)
            sort_order = body.get('sort_order', 0)
            tags = (body.get('tags') or '').strip()
            slug = re.sub(r'[^a-z0-9]+', '-', label.lower())[:50]
            if tid:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_topics SET label=%s, icon=%s, is_active=%s, sort_order=%s, tags=%s WHERE id=%s RETURNING id, slug, label, icon, sort_order, is_active, tags",
                    (label, icon, is_active, sort_order, tags, tid)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_topics (slug, label, icon, is_active, sort_order, tags) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, slug, label, icon, sort_order, is_active, tags",
                    (slug, label, icon, is_active, sort_order, tags)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'topic': dict(row)})

        if action == 'delete_topic':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            tid = body.get('id')
            if not tid:
                return err('Не указан id')
            cur.execute(f"DELETE FROM {SCHEMA}.chat_messages WHERE topic_id=%s", (tid,))
            cur.execute(f"DELETE FROM {SCHEMA}.chat_topics WHERE id=%s", (tid,))
            conn.commit()
            return ok({'ok': True})

        if action == 'save_message':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            mid = body.get('id')
            tid = body.get('topic_id')
            text = (body.get('text') or '').strip()
            if not text:
                return err('Текст сообщения обязателен')
            sort_order = body.get('sort_order', 0)
            video_title = body.get('video_title') or None
            video_url = body.get('video_url') or None
            video_thumb = body.get('video_thumb') or None
            image_url = body.get('image_url') or None
            image_caption = body.get('image_caption') or None
            options = json.dumps(body.get('options') or [], ensure_ascii=False)
            is_360 = bool(body.get('is_360', False))
            if mid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.chat_messages SET text=%s, sort_order=%s, video_title=%s, video_url=%s,
                        video_thumb=%s, image_url=%s, image_caption=%s, options=%s, is_360=%s WHERE id=%s
                        RETURNING id, topic_id, sort_order, text, video_title, video_url, video_thumb, image_url, image_caption, options, is_360""",
                    (text, sort_order, video_title, video_url, video_thumb, image_url, image_caption, options, is_360, mid)
                )
            else:
                if not tid:
                    return err('Не указана тема')
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.chat_messages (topic_id, sort_order, text, video_title, video_url, video_thumb, image_url, image_caption, options, is_360)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id, topic_id, sort_order, text, video_title, video_url, video_thumb, image_url, image_caption, options, is_360""",
                    (tid, sort_order, text, video_title, video_url, video_thumb, image_url, image_caption, options, is_360)
                )
            row = cur.fetchone()
            conn.commit()
            msg = dict(row)
            msg['options'] = json.loads(msg['options']) if isinstance(msg['options'], str) else (msg['options'] or [])
            return ok({'message': msg})

        if action == 'delete_message':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            mid = body.get('id')
            if not mid:
                return err('Не указан id')
            cur.execute(f"DELETE FROM {SCHEMA}.chat_messages WHERE id=%s", (mid,))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_topics':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            for item in (body.get('order') or []):
                cur.execute(f"UPDATE {SCHEMA}.chat_topics SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_messages':
            if not is_admin_or_manager(cur, token, 'can_content'):
                return err('Доступ запрещён', 403)
            for item in (body.get('order') or []):
                cur.execute(f"UPDATE {SCHEMA}.chat_messages SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════════
        # LOGS
        # ══════════════════════════════════════════════════════════════════════

        if action == 'logs_students':
            if not is_admin_or_manager(cur, token, 'can_stats'):
                return err('Доступ запрещён', 403)
            cur.execute(f"""
                SELECT student_id, MAX(student_name) as student_name,
                       COUNT(*) FILTER (WHERE role='user') as messages_count,
                       MAX(created_at) as last_active
                FROM {SCHEMA}.chat_logs WHERE student_id IS NOT NULL
                GROUP BY student_id ORDER BY last_active DESC LIMIT 200
            """)
            students = [dict(r) for r in cur.fetchall()]
            cur.execute(f"SELECT COUNT(*) FILTER (WHERE role='user') as messages_count, MAX(created_at) as last_active FROM {SCHEMA}.chat_logs WHERE student_id IS NULL")
            return ok({'students': students, 'anonymous': dict(cur.fetchone())})

        if action == 'logs_history':
            if not is_admin_or_manager(cur, token, 'can_stats'):
                return err('Доступ запрещён', 403)
            sid = body.get('student_id')
            limit = min(int(body.get('limit', 200)), 500)
            if sid:
                cur.execute(f"SELECT id, mode, role, message, created_at FROM {SCHEMA}.chat_logs WHERE student_id=%s ORDER BY created_at DESC LIMIT %s", (sid, limit))
            else:
                cur.execute(f"SELECT id, mode, role, message, created_at FROM {SCHEMA}.chat_logs WHERE student_id IS NULL ORDER BY created_at DESC LIMIT %s", (limit,))
            return ok({'messages': list(reversed([dict(r) for r in cur.fetchall()]))})

        if action == 'logs_stats':
            if not is_admin_or_manager(cur, token, 'can_stats'):
                return err('Доступ запрещён', 403)
            cur.execute(f"""
                SELECT COUNT(DISTINCT student_id) as unique_students,
                       COUNT(*) FILTER (WHERE role='user') as total_questions,
                       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND role='user') as today_questions,
                       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND role='user') as week_questions
                FROM {SCHEMA}.chat_logs
            """)
            return ok({'stats': dict(cur.fetchone())})

        return err('Unknown action')

    finally:
        cur.close()
        conn.close()