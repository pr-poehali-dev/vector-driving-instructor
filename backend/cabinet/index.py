"""
Личный кабинет ученика: дашборд, профиль, уведомления, избранное.

=== STUDENT ===
action=get_dashboard            сводка для главной страницы кабинета
action=get_profile
action=update_profile           name?
action=get_notifications        (студент) список уведомлений с флагом read
action=mark_notification_read   id
action=get_favorites            item_type?
action=add_favorite             item_type, item_id
action=remove_favorite          item_type, item_id

=== ADMIN (can_students или can_support) ===
action=notifications-list       (все уведомления, для истории отправки)
action=notifications-send       title, message, target_type ('all'|'group'|'student'), target_student_id?, target_group?
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, status=400):
    return ok({'error': msg}, status)


def get_student(cur, token):
    if not token:
        return None
    cur.execute(
        f"""SELECT s.id, s.name, s.login, s.study_category, s.group_name, s.study_status, s.study_start_date,
                   s.created_at, s.access_until
            FROM {SCHEMA}.sessions sess
            JOIN {SCHEMA}.students s ON s.id=sess.student_id
            WHERE sess.token=%s AND sess.expires_at > NOW() AND s.is_active=TRUE""",
        (token,)
    )
    return cur.fetchone()


def is_admin(cur, token):
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    return cur.fetchone() is not None


def is_admin_or_manager(cur, token):
    if is_admin(cur, token):
        return True
    if not token:
        return False
    cur.execute(
        f"""SELECT m.can_students FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    row = cur.fetchone()
    return bool(row and row['can_students'])


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
        # ══════════════════════════════════════════════════════════════════
        # DASHBOARD / PROFILE
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_dashboard':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            sid = student['id']

            cur.execute(
                f"""SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='completed') as completed
                    FROM {SCHEMA}.pdd_topics t
                    LEFT JOIN {SCHEMA}.student_pdd_progress p ON p.topic_id=t.id AND p.student_id=%s
                    WHERE t.is_active=TRUE""",
                (sid,)
            )
            topics_stat = cur.fetchone()

            cur.execute(
                f"""SELECT COUNT(*) as tests_done, COALESCE(SUM(correct_count),0) as total_correct,
                           COALESCE(SUM(total_questions),0) as total_questions
                    FROM {SCHEMA}.test_sessions WHERE student_id=%s AND finished_at IS NOT NULL""",
                (sid,)
            )
            tests_stat = cur.fetchone()

            cur.execute(
                f"""SELECT correct_count, total_questions, finished_at
                    FROM {SCHEMA}.test_sessions WHERE student_id=%s AND finished_at IS NOT NULL
                    ORDER BY finished_at DESC LIMIT 1""",
                (sid,)
            )
            last_test = cur.fetchone()

            cur.execute(
                f"""SELECT t.id, t.title, c.label as category_label, t.category_id
                    FROM {SCHEMA}.student_pdd_progress p
                    JOIN {SCHEMA}.pdd_topics t ON t.id=p.topic_id
                    JOIN {SCHEMA}.pdd_categories c ON c.id=t.category_id
                    WHERE p.student_id=%s AND p.status='completed'
                    ORDER BY p.updated_at DESC LIMIT 1""",
                (sid,)
            )
            last_topic = cur.fetchone()

            cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.student_mistakes WHERE student_id=%s AND resolved=FALSE", (sid,))
            mistakes_count = cur.fetchone()['cnt']

            cur.execute(
                f"""SELECT COUNT(*) as cnt FROM {SCHEMA}.notifications n
                    WHERE (n.target_type='all' OR (n.target_type='student' AND n.target_student_id=%s)
                           OR (n.target_type='group' AND n.target_group=%s))
                      AND NOT EXISTS (SELECT 1 FROM {SCHEMA}.notification_reads r WHERE r.notification_id=n.id AND r.student_id=%s)""",
                (sid, student['group_name'], sid)
            )
            unread_notifications = cur.fetchone()['cnt']

            total_topics = topics_stat['total'] or 0
            completed_topics = topics_stat['completed'] or 0
            pdd_percent = round(100 * completed_topics / total_topics) if total_topics else 0
            total_q = tests_stat['total_questions'] or 0
            avg_score = round(100 * (tests_stat['total_correct'] or 0) / total_q) if total_q else 0

            return ok({
                'student': dict(student),
                'pdd_progress': {
                    'total_topics': total_topics, 'completed_topics': completed_topics, 'percent': pdd_percent,
                    'last_topic': dict(last_topic) if last_topic else None,
                },
                'tests': {
                    'tests_done': tests_stat['tests_done'] or 0, 'avg_score_percent': avg_score,
                    'last_result': dict(last_test) if last_test else None,
                },
                'mistakes_count': mistakes_count,
                'unread_notifications': unread_notifications,
            })

        if action == 'get_profile':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            return ok({'student': dict(student)})

        if action == 'update_profile':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            name = (body.get('name') or '').strip()
            if not name:
                return err('Имя не может быть пустым')
            cur.execute(f"UPDATE {SCHEMA}.students SET name=%s WHERE id=%s", (name, student['id']))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # NOTIFICATIONS
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_notifications':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            cur.execute(
                f"""SELECT n.id, n.title, n.message, n.created_at,
                           (r.id IS NOT NULL) as is_read
                    FROM {SCHEMA}.notifications n
                    LEFT JOIN {SCHEMA}.notification_reads r ON r.notification_id=n.id AND r.student_id=%s
                    WHERE n.target_type='all' OR (n.target_type='student' AND n.target_student_id=%s)
                          OR (n.target_type='group' AND n.target_group=%s)
                    ORDER BY n.created_at DESC LIMIT 100""",
                (student['id'], student['id'], student['group_name'])
            )
            return ok({'notifications': [dict(r) for r in cur.fetchall()]})

        if action == 'mark_notification_read':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            nid = body.get('id')
            if not nid:
                return err('Не указан id')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.notification_reads (notification_id, student_id)
                    VALUES (%s,%s) ON CONFLICT (notification_id, student_id) DO NOTHING""",
                (nid, student['id'])
            )
            conn.commit()
            return ok({'ok': True})

        if action == 'notifications-list':
            if not is_admin_or_manager(cur, token):
                return err('Доступ запрещён', 403)
            cur.execute(
                f"""SELECT n.id, n.title, n.message, n.target_type, n.target_group, n.created_at,
                           s.name as target_student_name
                    FROM {SCHEMA}.notifications n
                    LEFT JOIN {SCHEMA}.students s ON s.id=n.target_student_id
                    ORDER BY n.created_at DESC LIMIT 200"""
            )
            return ok({'notifications': [dict(r) for r in cur.fetchall()]})

        if action == 'notifications-send':
            if not is_admin_or_manager(cur, token):
                return err('Доступ запрещён', 403)
            title = (body.get('title') or '').strip()
            message = (body.get('message') or '').strip()
            target_type = body.get('target_type', 'all')
            if not title or not message:
                return err('Заголовок и текст обязательны')
            if target_type not in ('all', 'group', 'student'):
                return err('Некорректный тип получателя')
            target_student_id = body.get('target_student_id') if target_type == 'student' else None
            target_group = (body.get('target_group') or '').strip() if target_type == 'group' else None
            if target_type == 'student' and not target_student_id:
                return err('Не указан ученик')
            if target_type == 'group' and not target_group:
                return err('Не указана группа')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.notifications (title, message, target_type, target_student_id, target_group)
                    VALUES (%s,%s,%s,%s,%s) RETURNING id, title, message, target_type, target_group, created_at""",
                (title, message, target_type, target_student_id, target_group)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'notification': dict(row)})

        # ══════════════════════════════════════════════════════════════════
        # FAVORITES
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_favorites':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            item_type = body.get('item_type')
            where = 'WHERE student_id=%s'
            params = [student['id']]
            if item_type:
                where += ' AND item_type=%s'
                params.append(item_type)
            cur.execute(f"SELECT id, item_type, item_id, created_at FROM {SCHEMA}.favorites {where} ORDER BY created_at DESC", params)
            return ok({'favorites': [dict(r) for r in cur.fetchall()]})

        if action == 'add_favorite':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            item_type = body.get('item_type')
            item_id = body.get('item_id')
            if not item_type or not item_id:
                return err('Не указан тип или id элемента')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.favorites (student_id, item_type, item_id)
                    VALUES (%s,%s,%s) ON CONFLICT (student_id, item_type, item_id) DO NOTHING
                    RETURNING id, item_type, item_id, created_at""",
                (student['id'], item_type, item_id)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'favorite': dict(row) if row else None})

        if action == 'remove_favorite':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            item_type = body.get('item_type')
            item_id = body.get('item_id')
            cur.execute(
                f"DELETE FROM {SCHEMA}.favorites WHERE student_id=%s AND item_type=%s AND item_id=%s",
                (student['id'], item_type, item_id)
            )
            conn.commit()
            return ok({'ok': True})

        return err('Unknown action', 400)
    finally:
        cur.close()
        conn.close()