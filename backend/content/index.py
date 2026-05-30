"""
Управление контентом чат-бота автошколы Вектор.
action=get_topics      — все темы с сообщениями (публичный, для чат-бота)
action=save_topic      — создать/обновить тему (только admin)
action=delete_topic    — удалить тему (только admin)
action=save_message    — создать/обновить сообщение (только admin)
action=delete_message  — удалить сообщение (только admin)
action=reorder_topics  — изменить порядок тем (только admin)
action=reorder_messages — изменить порядок сообщений (только admin)
"""
import json
import os
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


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str),
    }


def is_admin(cur, token):
    if not token:
        return False
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    return cur.fetchone() is not None


def get_topics_data(cur):
    cur.execute(
        f"""SELECT id, slug, label, icon, sort_order, is_active, tags
            FROM {SCHEMA}.chat_topics
            WHERE is_active=TRUE
            ORDER BY sort_order, id"""
    )
    topics = [dict(r) for r in cur.fetchall()]
    for t in topics:
        cur.execute(
            f"""SELECT id, sort_order, text,
                       video_title, video_url, video_thumb,
                       image_url, image_caption, options
                FROM {SCHEMA}.chat_messages
                WHERE topic_id=%s
                ORDER BY sort_order, id""",
            (t['id'],)
        )
        msgs = []
        for m in cur.fetchall():
            msg = dict(m)
            msg['options'] = msg['options'] if msg['options'] else []
            msgs.append(msg)
        t['messages'] = msgs
    return topics


def get_all_topics_admin(cur):
    cur.execute(
        f"""SELECT id, slug, label, icon, sort_order, is_active, tags
            FROM {SCHEMA}.chat_topics
            ORDER BY sort_order, id"""
    )
    topics = [dict(r) for r in cur.fetchall()]
    for t in topics:
        cur.execute(
            f"""SELECT id, sort_order, text,
                       video_title, video_url, video_thumb,
                       image_url, image_caption, options
                FROM {SCHEMA}.chat_messages
                WHERE topic_id=%s
                ORDER BY sort_order, id""",
            (t['id'],)
        )
        msgs = []
        for m in cur.fetchall():
            msg = dict(m)
            msg['options'] = msg['options'] if msg['options'] else []
            msgs.append(msg)
        t['messages'] = msgs
    return topics


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
        # ── Публичный: получить все темы для чат-бота ──
        if action == 'get_topics':
            topics = get_topics_data(cur)
            return resp({'topics': topics})

        # ── Все темы для админа (включая неактивные) ──
        if action == 'get_all_topics':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            topics = get_all_topics_admin(cur)
            return resp({'topics': topics})

        # ── Создать или обновить тему ──
        if action == 'save_topic':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            topic_id = body.get('id')
            label = (body.get('label') or '').strip()
            icon = (body.get('icon') or 'BookOpen').strip()
            is_active = body.get('is_active', True)
            sort_order = body.get('sort_order', 0)
            tags = (body.get('tags') or '').strip()
            if not label:
                return resp({'error': 'Название темы обязательно'}, 400)

            import re
            slug = re.sub(r'[^a-z0-9]+', '-', label.lower())[:50]

            if topic_id:
                cur.execute(
                    f"""UPDATE {SCHEMA}.chat_topics
                        SET label=%s, icon=%s, is_active=%s, sort_order=%s, tags=%s
                        WHERE id=%s
                        RETURNING id, slug, label, icon, sort_order, is_active, tags""",
                    (label, icon, is_active, sort_order, tags, topic_id)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.chat_topics (slug, label, icon, is_active, sort_order, tags)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, slug, label, icon, sort_order, is_active, tags""",
                    (slug, label, icon, is_active, sort_order, tags)
                )
            row = cur.fetchone()
            conn.commit()
            return resp({'topic': dict(row)})

        # ── Удалить тему ──
        if action == 'delete_topic':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            topic_id = body.get('id')
            if not topic_id:
                return resp({'error': 'Не указан id'}, 400)
            cur.execute(f"DELETE FROM {SCHEMA}.chat_messages WHERE topic_id=%s", (topic_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.chat_topics WHERE id=%s", (topic_id,))
            conn.commit()
            return resp({'ok': True})

        # ── Создать или обновить сообщение ──
        if action == 'save_message':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            msg_id = body.get('id')
            topic_id = body.get('topic_id')
            text = (body.get('text') or '').strip()
            sort_order = body.get('sort_order', 0)
            video_title = body.get('video_title') or None
            video_url = body.get('video_url') or None
            video_thumb = body.get('video_thumb') or None
            image_url = body.get('image_url') or None
            image_caption = body.get('image_caption') or None
            options = json.dumps(body.get('options') or [], ensure_ascii=False)

            if not text:
                return resp({'error': 'Текст сообщения обязателен'}, 400)

            if msg_id:
                cur.execute(
                    f"""UPDATE {SCHEMA}.chat_messages
                        SET text=%s, sort_order=%s,
                            video_title=%s, video_url=%s, video_thumb=%s,
                            image_url=%s, image_caption=%s, options=%s
                        WHERE id=%s
                        RETURNING id, topic_id, sort_order, text,
                                  video_title, video_url, video_thumb,
                                  image_url, image_caption, options""",
                    (text, sort_order, video_title, video_url, video_thumb,
                     image_url, image_caption, options, msg_id)
                )
            else:
                if not topic_id:
                    return resp({'error': 'Не указана тема'}, 400)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.chat_messages
                        (topic_id, sort_order, text, video_title, video_url, video_thumb,
                         image_url, image_caption, options)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, topic_id, sort_order, text,
                                  video_title, video_url, video_thumb,
                                  image_url, image_caption, options""",
                    (topic_id, sort_order, text, video_title, video_url, video_thumb,
                     image_url, image_caption, options)
                )
            row = cur.fetchone()
            conn.commit()
            msg = dict(row)
            msg['options'] = msg['options'] if msg['options'] else []
            return resp({'message': msg})

        # ── Удалить сообщение ──
        if action == 'delete_message':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            msg_id = body.get('id')
            if not msg_id:
                return resp({'error': 'Не указан id'}, 400)
            cur.execute(f"DELETE FROM {SCHEMA}.chat_messages WHERE id=%s", (msg_id,))
            conn.commit()
            return resp({'ok': True})

        # ── Изменить порядок тем ──
        if action == 'reorder_topics':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            order = body.get('order', [])  # [{id, sort_order}]
            for item in order:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_topics SET sort_order=%s WHERE id=%s",
                    (item['sort_order'], item['id'])
                )
            conn.commit()
            return resp({'ok': True})

        # ── Изменить порядок сообщений ──
        if action == 'reorder_messages':
            if not is_admin(cur, token):
                return resp({'error': 'Доступ запрещён'}, 403)
            order = body.get('order', [])
            for item in order:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_messages SET sort_order=%s WHERE id=%s",
                    (item['sort_order'], item['id'])
                )
            conn.commit()
            return resp({'ok': True})

        return resp({'error': 'Unknown action'}, 400)

    finally:
        cur.close()
        conn.close()