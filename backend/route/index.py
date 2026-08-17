"""
Раздел «Экзаменационный маршрут» личного кабинета ученика: маршруты, точки, видео, прогресс изучения.

=== PUBLIC / STUDENT ===
action=get_routes               (публичный) список активных маршрутов
action=get_route                route_id               маршрут с линией пути и всеми точками (с прогрессом если авторизован)
action=mark_point_studied       (студент) route_point_id — отметить точку как изученную

=== ADMIN (can_route) ===
action=get_all_routes
action=save_route               id?, title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order
action=delete_route             id

action=get_route_points         route_id
action=save_route_point         id?, route_id, point_number, title, point_type, lat, lng,
                                 video_url, video_title, video_thumb,
                                 description, action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active
action=delete_route_point       id
action=reorder_route_points     order=[{id,sort_order}]
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
        f"""SELECT s.id, s.name FROM {SCHEMA}.sessions sess
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


def is_admin_or_manager_route(cur, token):
    if is_admin(cur, token):
        return True
    if not token:
        return False
    cur.execute(
        f"""SELECT m.can_route FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    row = cur.fetchone()
    return bool(row and row['can_route'])


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
        # ROUTES (public/admin)
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_routes':
            cur.execute(
                f"""SELECT id, title, city, description, center_lat, center_lng, zoom_level, sort_order
                    FROM {SCHEMA}.exam_routes WHERE is_active=TRUE ORDER BY sort_order, id"""
            )
            routes = [dict(r) for r in cur.fetchall()]
            for rt in routes:
                cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.route_points WHERE route_id=%s AND is_active=TRUE", (rt['id'],))
                rt['points_count'] = cur.fetchone()['cnt']
            return ok({'routes': routes})

        if action == 'get_route':
            route_id = body.get('route_id')
            if not route_id:
                return err('Не указан маршрут')
            student = get_student(cur, token)
            cur.execute(
                f"""SELECT id, title, city, description, center_lat, center_lng, zoom_level, route_line
                    FROM {SCHEMA}.exam_routes WHERE id=%s AND is_active=TRUE""",
                (route_id,)
            )
            route = cur.fetchone()
            if not route:
                return err('Маршрут не найден', 404)
            route = dict(route)
            cur.execute(
                f"""SELECT p.id, p.point_number, p.title, p.point_type, p.lat, p.lng,
                           p.video_url, p.video_title, p.video_thumb,
                           p.description, p.action_steps, p.common_mistakes, p.pdd_refs, p.scheme_image_url, p.difficulty,
                           (sp.id IS NOT NULL) as studied
                    FROM {SCHEMA}.route_points p
                    LEFT JOIN {SCHEMA}.student_route_progress sp ON sp.route_point_id=p.id AND sp.student_id=%s
                    WHERE p.route_id=%s AND p.is_active=TRUE
                    ORDER BY p.sort_order, p.point_number""",
                (student['id'] if student else None, route_id)
            )
            route['points'] = [dict(r) for r in cur.fetchall()]
            return ok({'route': route})

        if action == 'mark_point_studied':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            point_id = body.get('route_point_id')
            if not point_id:
                return err('Не указана точка маршрута')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.student_route_progress (student_id, route_point_id)
                    VALUES (%s,%s) ON CONFLICT (student_id, route_point_id) DO NOTHING""",
                (student['id'], point_id)
            )
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # ADMIN: ROUTES
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_all_routes':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            cur.execute(
                f"""SELECT id, title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order
                    FROM {SCHEMA}.exam_routes ORDER BY sort_order, id"""
            )
            return ok({'routes': [dict(r) for r in cur.fetchall()]})

        if action == 'save_route':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            rid = body.get('id')
            title = (body.get('title') or '').strip()
            if not title:
                return err('Название маршрута обязательно')
            city = (body.get('city') or 'Курган').strip()
            description = body.get('description') or ''
            center_lat = float(body.get('center_lat', 55.45))
            center_lng = float(body.get('center_lng', 65.3333))
            zoom_level = int(body.get('zoom_level', 14))
            route_line = json.dumps(body.get('route_line') or [], ensure_ascii=False)
            is_active = body.get('is_active', True)
            sort_order = body.get('sort_order', 0)
            if rid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.exam_routes SET title=%s, city=%s, description=%s,
                        center_lat=%s, center_lng=%s, zoom_level=%s, route_line=%s, is_active=%s, sort_order=%s
                        WHERE id=%s RETURNING id, title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order""",
                    (title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order, rid)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.exam_routes (title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id, title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order""",
                    (title, city, description, center_lat, center_lng, zoom_level, route_line, is_active, sort_order)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'route': dict(row)})

        if action == 'delete_route':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            rid = body.get('id')
            if not rid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.exam_routes SET is_active=FALSE WHERE id=%s", (rid,))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # ADMIN: ROUTE POINTS
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_route_points':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            route_id = body.get('route_id')
            if not route_id:
                return err('Не указан маршрут')
            cur.execute(
                f"""SELECT id, route_id, point_number, title, point_type, lat, lng,
                           video_url, video_title, video_thumb,
                           description, action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active
                    FROM {SCHEMA}.route_points WHERE route_id=%s ORDER BY sort_order, point_number""",
                (route_id,)
            )
            return ok({'points': [dict(r) for r in cur.fetchall()]})

        if action == 'save_route_point':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            pid = body.get('id')
            route_id = body.get('route_id')
            title = (body.get('title') or '').strip()
            if not route_id or not title:
                return err('Маршрут и название точки обязательны')
            point_number = int(body.get('point_number', 1))
            point_type = body.get('point_type') or 'other'
            lat = float(body.get('lat', 0))
            lng = float(body.get('lng', 0))
            video_url = body.get('video_url') or None
            video_title = body.get('video_title') or None
            video_thumb = body.get('video_thumb') or None
            description = body.get('description') or ''
            action_steps = json.dumps(body.get('action_steps') or [], ensure_ascii=False)
            common_mistakes = json.dumps(body.get('common_mistakes') or [], ensure_ascii=False)
            pdd_refs = json.dumps(body.get('pdd_refs') or [], ensure_ascii=False)
            scheme_image_url = body.get('scheme_image_url') or None
            difficulty = body.get('difficulty') or 'normal'
            sort_order = body.get('sort_order', point_number)
            is_active = body.get('is_active', True)
            if pid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.route_points SET route_id=%s, point_number=%s, title=%s, point_type=%s, lat=%s, lng=%s,
                        video_url=%s, video_title=%s, video_thumb=%s, description=%s, action_steps=%s, common_mistakes=%s, pdd_refs=%s,
                        scheme_image_url=%s, difficulty=%s, sort_order=%s, is_active=%s
                        WHERE id=%s RETURNING id, route_id, point_number, title, point_type, lat, lng, video_url, video_title, video_thumb,
                                  description, action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active""",
                    (route_id, point_number, title, point_type, lat, lng, video_url, video_title, video_thumb, description, action_steps,
                     common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active, pid)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.route_points
                        (route_id, point_number, title, point_type, lat, lng, video_url, video_title, video_thumb, description,
                         action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id, route_id, point_number, title, point_type, lat, lng, video_url, video_title, video_thumb,
                                  description, action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active""",
                    (route_id, point_number, title, point_type, lat, lng, video_url, video_title, video_thumb, description,
                     action_steps, common_mistakes, pdd_refs, scheme_image_url, difficulty, sort_order, is_active)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'point': dict(row)})

        if action == 'delete_route_point':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            pid = body.get('id')
            if not pid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.route_points SET is_active=FALSE WHERE id=%s", (pid,))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_route_points':
            if not is_admin_or_manager_route(cur, token):
                return err('Доступ запрещён', 403)
            for item in (body.get('order') or []):
                cur.execute(f"UPDATE {SCHEMA}.route_points SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
            conn.commit()
            return ok({'ok': True})

        return err('Unknown action', 400)
    finally:
        cur.close()
        conn.close()