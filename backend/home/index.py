"""
Контент главной страницы: автопарк, мастера, видео, FAQ, адреса, демо-блок, ключ карты.
action=get_home            (публичный) весь контент
action=submit_lead         name, phone, branch, tariff   (публичный, заявка с формы сайта)
action=leads_list          status?    (админ/менеджер)
action=lead_update         id, status?, note?
action=lead_delete         id
action=save_item           section, data, id?, sort_order?, is_active?
action=delete_item         id
action=reorder_items       order=[id,...]
action=save_setting        key, value
action=upload_image        file_name, content_base64   (до ~3 МБ, картинки)
action=presign_video       file_name                   (ссылка для прямой загрузки видео из браузера)
action=video               key (GET)                   (переход на временную ссылку просмотра видео)
"""
import base64
import json
import os
import re
import secrets
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}
SECTIONS = {'fleet', 'masters', 'videos', 'faq', 'locations'}
SETTING_KEYS = {'demo', 'map'}
IMG_TYPES = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
VIDEO_TYPES = {'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime'}


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, status=400):
    return ok({'error': msg}, status)


def s3_client():
    return boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def cdn_url(key):
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def reg45_client():
    access = f"{os.environ['REG45_S3_TENANT_ID']}:{os.environ['REG45_S3_ACCESS_KEY']}"
    return boto3.client(
        's3', endpoint_url='https://s3.cloud.ru', region_name='ru-central-1',
        aws_access_key_id=access, aws_secret_access_key=os.environ['REG45_S3_SECRET_KEY'],
    )


def can_manage_leads(cur, token):
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    if cur.fetchone():
        return True
    cur.execute(
        f"""SELECT m.can_students FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    row = cur.fetchone()
    return bool(row and row['can_students'])


LEAD_STATUSES = {'new', 'in_work', 'done', 'rejected'}


def can_edit(cur, token):
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > NOW()", (token,))
    if cur.fetchone():
        return True
    cur.execute(
        f"""SELECT m.can_content FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    row = cur.fetchone()
    return bool(row and row['can_content'])


def safe_key(prefix, file_name, allowed):
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
    if ext not in allowed:
        return None, None
    return f"home/{prefix}/{secrets.token_hex(8)}.{ext}", allowed[ext]


def handler(event: dict, context) -> dict:
    """Контент главной страницы: чтение для сайта и правки из админки."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass
    qs = event.get('queryStringParameters') or {}
    action = body.get('action') or qs.get('action') or 'get_home'
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if action == 'video':
            key = (qs.get('key') or body.get('key') or '').strip()
            if not key.startswith('site-home/') or '..' in key:
                return err('Неверный ключ', 400)
            url = reg45_client().generate_presigned_url(
                'get_object', Params={'Bucket': 'reg-45', 'Key': key}, ExpiresIn=6 * 3600
            )
            return {'statusCode': 302, 'headers': {**CORS, 'Location': url, 'Cache-Control': 'public, max-age=1800'}, 'body': ''}

        if action == 'get_home':
            cur.execute(
                f"SELECT id, section, data, sort_order FROM {SCHEMA}.home_items WHERE is_active=TRUE ORDER BY sort_order, id"
            )
            items = {s: [] for s in SECTIONS}
            for r in cur.fetchall():
                items[r['section']].append({'id': r['id'], **r['data']})
            cur.execute(f"SELECT key, value FROM {SCHEMA}.home_settings")
            settings = {r['key']: r['value'] for r in cur.fetchall()}
            return ok({'items': items, 'settings': settings})

        if action == 'submit_lead':
            name = (body.get('name') or '').strip()[:100]
            phone = (body.get('phone') or '').strip()[:30]
            branch = (body.get('branch') or '').strip()[:200]
            category = (body.get('tariff') or body.get('category') or '').strip()[:100]
            if (body.get('website') or '').strip():
                return ok({'ok': True})
            if len(name) < 2 or len(re.sub(r'\D', '', phone)) != 11:
                return err('Проверьте имя и телефон')
            cur.execute(
                f"""SELECT count(*) AS n FROM {SCHEMA}.leads
                    WHERE phone=%s AND created_at > NOW() - INTERVAL '10 minutes'""",
                (phone,)
            )
            if cur.fetchone()['n'] >= 3:
                return ok({'ok': True})
            cur.execute(
                f"INSERT INTO {SCHEMA}.leads (name, phone, branch, category) VALUES (%s,%s,%s,%s) RETURNING id",
                (name, phone, branch, category)
            )
            lead_id = cur.fetchone()['id']
            conn.commit()
            return ok({'ok': True, 'id': lead_id})

        if action in ('leads_list', 'lead_update', 'lead_delete'):
            if not can_manage_leads(cur, token):
                return err('Доступ запрещён', 403)
            if action == 'leads_list':
                status = body.get('status')
                if status in LEAD_STATUSES:
                    cur.execute(
                        f"""SELECT id, name, phone, branch, category, status, note, created_at
                            FROM {SCHEMA}.leads WHERE status=%s ORDER BY created_at DESC LIMIT 500""",
                        (status,)
                    )
                else:
                    cur.execute(
                        f"""SELECT id, name, phone, branch, category, status, note, created_at
                            FROM {SCHEMA}.leads ORDER BY created_at DESC LIMIT 500"""
                    )
                rows = [dict(r) for r in cur.fetchall()]
                cur.execute(f"SELECT count(*) AS n FROM {SCHEMA}.leads WHERE status='new'")
                return ok({'leads': rows, 'new_count': cur.fetchone()['n']})
            lead_id = body.get('id')
            if not isinstance(lead_id, int):
                return err('Не указана заявка')
            if action == 'lead_delete':
                cur.execute(f"DELETE FROM {SCHEMA}.leads WHERE id=%s", (lead_id,))
                conn.commit()
                return ok({'ok': True})
            fields, values = [], []
            if body.get('status') in LEAD_STATUSES:
                fields.append('status=%s')
                values.append(body['status'])
            if 'note' in body:
                fields.append('note=%s')
                values.append(str(body.get('note') or '')[:1000])
            if not fields:
                return err('Нет данных')
            fields.append('updated_at=NOW()')
            values.append(lead_id)
            cur.execute(f"UPDATE {SCHEMA}.leads SET {', '.join(fields)} WHERE id=%s", values)
            conn.commit()
            return ok({'ok': True})

        if not can_edit(cur, token):
            return err('Доступ запрещён', 403)

        if action == 'get_home_admin':
            cur.execute(f"SELECT id, section, data, sort_order, is_active FROM {SCHEMA}.home_items ORDER BY sort_order, id")
            items = {s: [] for s in SECTIONS}
            for r in cur.fetchall():
                items[r['section']].append({'id': r['id'], 'is_active': r['is_active'], 'data': r['data']})
            cur.execute(f"SELECT key, value FROM {SCHEMA}.home_settings")
            settings = {r['key']: r['value'] for r in cur.fetchall()}
            return ok({'items': items, 'settings': settings})

        if action == 'save_item':
            section = body.get('section')
            data = body.get('data')
            if section not in SECTIONS or not isinstance(data, dict):
                return err('Неверные данные')
            item_id = body.get('id')
            if item_id:
                cur.execute(
                    f"""UPDATE {SCHEMA}.home_items SET data=%s, is_active=COALESCE(%s, is_active)
                        WHERE id=%s AND section=%s RETURNING id, section, data, sort_order, is_active""",
                    (json.dumps(data, ensure_ascii=False), body.get('is_active'), item_id, section)
                )
            else:
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM {SCHEMA}.home_items WHERE section=%s", (section,))
                nxt = cur.fetchone()['n']
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.home_items (section, data, sort_order) VALUES (%s,%s,%s)
                        RETURNING id, section, data, sort_order, is_active""",
                    (section, json.dumps(data, ensure_ascii=False), nxt)
                )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err('Запись не найдена', 404)
            return ok({'item': {'id': row['id'], 'is_active': row['is_active'], 'data': row['data']}})

        if action == 'delete_item':
            cur.execute(f"DELETE FROM {SCHEMA}.home_items WHERE id=%s", (body.get('id'),))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_items':
            order = body.get('order') or []
            for idx, item_id in enumerate(order):
                cur.execute(f"UPDATE {SCHEMA}.home_items SET sort_order=%s WHERE id=%s", (idx + 1, item_id))
            conn.commit()
            return ok({'ok': True})

        if action == 'save_setting':
            key = body.get('key')
            value = body.get('value')
            if key not in SETTING_KEYS or not isinstance(value, dict):
                return err('Неверные данные')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.home_settings (key, value) VALUES (%s,%s)
                    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()""",
                (key, json.dumps(value, ensure_ascii=False))
            )
            conn.commit()
            return ok({'ok': True})

        if action == 'upload_image':
            name = (body.get('file_name') or '').strip()
            raw = body.get('content_base64') or ''
            key, ctype = safe_key('img', name, IMG_TYPES)
            if not key or not raw:
                return err('Нужна картинка JPG, PNG или WEBP')
            data = base64.b64decode(raw)
            if len(data) > 4 * 1024 * 1024:
                return err('Файл больше 4 МБ')
            s3_client().put_object(Bucket='files', Key=key, Body=data, ContentType=ctype)
            return ok({'url': cdn_url(key)})

        if action == 'presign_video':
            name = (body.get('file_name') or '').strip()
            ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
            if ext not in VIDEO_TYPES:
                return err('Нужно видео MP4, WEBM или MOV')
            ctype = VIDEO_TYPES[ext]
            key = f"site-home/video/{secrets.token_hex(8)}.{ext}"
            url = reg45_client().generate_presigned_url(
                'put_object', Params={'Bucket': 'reg-45', 'Key': key, 'ContentType': ctype}, ExpiresIn=3600
            )
            return ok({'upload_url': url, 'content_type': ctype, 'value': f'reg45:{key}'})

        return err('Неизвестное действие')
    finally:
        cur.close()
        conn.close()