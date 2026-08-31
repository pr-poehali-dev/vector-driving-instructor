"""
Личный кабинет инструктора (мастера производственного обучения вождению).

=== AUTH ===
action=login              login, password
action=me
action=logout

=== KPI ===
action=get_kpi            period? ('YYYY-MM-01', по умолчанию текущий месяц)

=== VIDEO REGISTRATOR (S3) ===
action=get_upload_url     shift_date, file_name, file_size, content_base64  (загрузка файла в S3, вернёт url)
action=get_archive        сгруппированный по датам список загруженных видео

=== PDD TEST ===
action=start_pdd_test     (случайные 20 вопросов из общего банка)
action=submit_pdd_test    session_id, answers=[{question_id, selected_index}]
"""
import json
import os
import random
import base64
import hashlib
import secrets
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

SCHEMA = os.environ['MAIN_DB_SCHEMA']
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

S3_BUCKET = 'files'
S3_ENDPOINT = 'https://bucket.poehali.dev'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, status=400):
    return ok({'error': msg}, status)


def hash_pw(p):
    return hashlib.sha256(p.encode()).hexdigest()


def make_token():
    return secrets.token_hex(32)


def now_utc():
    return datetime.now(timezone.utc)


def get_instructor(cur, token):
    if not token:
        return None
    cur.execute(
        f"""SELECT i.id, i.name, i.login, i.branch_id, i.car_model, b.name as branch_name
            FROM {SCHEMA}.instructor_sessions ins
            JOIN {SCHEMA}.instructors i ON i.id = ins.instructor_id
            LEFT JOIN {SCHEMA}.branches b ON b.id = i.branch_id
            WHERE ins.token=%s AND ins.expires_at > NOW() AND i.is_active=TRUE""",
        (token,)
    )
    return cur.fetchone()


def kpi_public(row):
    if not row:
        return None
    total = (
        row['pdd_test_points'] + row['practical_points'] + row['students_at_exam_points']
        + row['reviews_points'] + row['package_upgrades_points'] + row['discipline_points'] + row['service_points']
    )
    return {
        'period': row['period'],
        'total_score': total,
        'rank_in_branch': row['rank_in_branch'],
        'bonus_amount': float(row['bonus_amount']),
        'bonus_label': row['bonus_label'],
        'pdd_test': {'passed': row['pdd_test_passed'], 'points': row['pdd_test_points']},
        'practical': {'pass_percent': row['practical_pass_percent'], 'passed': row['practical_passed'], 'total': row['practical_total'], 'points': row['practical_points']},
        'students_at_exam': {'count': row['students_at_exam'], 'points': row['students_at_exam_points']},
        'reviews': {'count': row['reviews_count'], 'points': row['reviews_points']},
        'package_upgrades': {'count': row['package_upgrades'], 'points': row['package_upgrades_points']},
        'discipline_points': row['discipline_points'],
        'service_points': row['service_points'],
    }


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
        # AUTH
        # ══════════════════════════════════════════════════════════════════

        if action == 'login':
            login = (body.get('login') or '').strip().lower()
            password = (body.get('password') or '').strip()
            if not login or not password:
                return err('Введите логин и пароль')
            cur.execute(
                f"""SELECT i.id, i.name, i.branch_id, i.car_model, b.name as branch_name
                    FROM {SCHEMA}.instructors i
                    LEFT JOIN {SCHEMA}.branches b ON b.id = i.branch_id
                    WHERE i.login=%s AND i.password_hash=%s AND i.is_active=TRUE""",
                (login, hash_pw(password))
            )
            instr = cur.fetchone()
            if not instr:
                return err('Неверный логин или пароль', 401)
            t = make_token()
            cur.execute(f"INSERT INTO {SCHEMA}.instructor_sessions (instructor_id, token) VALUES (%s, %s)", (instr['id'], t))
            cur.execute(f"UPDATE {SCHEMA}.instructors SET last_seen=NOW() WHERE id=%s", (instr['id'],))
            conn.commit()
            return ok({'token': t, 'role': 'instructor', 'name': instr['name'], 'branch_name': instr['branch_name'], 'car_model': instr['car_model']})

        if action == 'me':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Сессия истекла', 401)
            cur.execute(f"UPDATE {SCHEMA}.instructors SET last_seen=NOW() WHERE id=%s", (instr['id'],))
            conn.commit()
            return ok({'role': 'instructor', 'name': instr['name'], 'branch_name': instr['branch_name'], 'car_model': instr['car_model']})

        if action == 'logout':
            if token:
                cur.execute(f"UPDATE {SCHEMA}.instructor_sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # KPI
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_kpi':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            period = body.get('period')
            if not period:
                cur.execute("SELECT date_trunc('month', now())::date as p")
                period = cur.fetchone()['p']
            cur.execute(
                f"""SELECT * FROM {SCHEMA}.instructor_kpi WHERE instructor_id=%s AND period=%s""",
                (instr['id'], period)
            )
            row = cur.fetchone()
            return ok({'kpi': kpi_public(row)})

        # ══════════════════════════════════════════════════════════════════
        # VIDEO REGISTRATOR (S3)
        # ══════════════════════════════════════════════════════════════════

        if action == 'upload_video':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            shift_date = body.get('shift_date')
            file_name = (body.get('file_name') or '').strip()
            content_b64 = body.get('content_base64')
            if not shift_date or not file_name or not content_b64:
                return err('Не переданы данные файла')

            file_bytes = base64.b64decode(content_b64)
            file_size = len(file_bytes)

            safe_name = ''.join(c for c in file_name if c.isalnum() or c in '._- ') or 'video.mp4'
            s3_key = f"instructor-videos/{instr['id']}/{shift_date}/{secrets.token_hex(4)}_{safe_name}"

            ext = safe_name.rsplit('.', 1)[-1].lower() if '.' in safe_name else 'mp4'
            content_type = {'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo'}.get(ext, 'application/octet-stream')

            s3 = boto3.client(
                's3', endpoint_url=S3_ENDPOINT,
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=file_bytes, ContentType=content_type)
            s3_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

            cur.execute(
                f"""INSERT INTO {SCHEMA}.instructor_video_uploads (instructor_id, shift_date, file_name, file_size, s3_key, s3_url)
                    VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, uploaded_at""",
                (instr['id'], shift_date, safe_name, file_size, s3_key, s3_url)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({'id': row['id'], 'file_name': safe_name, 'file_size': file_size, 's3_url': s3_url, 'uploaded_at': row['uploaded_at']})

        if action == 'get_archive':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            cur.execute(
                f"""SELECT id, shift_date, file_name, file_size, s3_url, uploaded_at
                    FROM {SCHEMA}.instructor_video_uploads WHERE instructor_id=%s ORDER BY shift_date DESC, uploaded_at DESC""",
                (instr['id'],)
            )
            rows = [dict(r) for r in cur.fetchall()]
            grouped = {}
            for r in rows:
                key = str(r['shift_date'])
                if key not in grouped:
                    grouped[key] = {'shift_date': key, 'files': [], 'total_size': 0}
                grouped[key]['files'].append(r)
                grouped[key]['total_size'] += r['file_size']
            return ok({'shifts': list(grouped.values())})

        # ══════════════════════════════════════════════════════════════════
        # PDD TEST (ежемесячный зачёт мастера)
        # ══════════════════════════════════════════════════════════════════

        if action == 'start_pdd_test':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            cur.execute(f"SELECT id FROM {SCHEMA}.pdd_questions WHERE is_active=TRUE")
            q_ids = [r['id'] for r in cur.fetchall()]
            if not q_ids:
                return err('Вопросов не найдено')
            random.shuffle(q_ids)
            q_ids = q_ids[:20]

            cur.execute(
                f"""INSERT INTO {SCHEMA}.instructor_pdd_tests (instructor_id, total_questions) VALUES (%s,%s) RETURNING id""",
                (instr['id'], len(q_ids))
            )
            session_id = cur.fetchone()['id']
            conn.commit()

            cur.execute(f"SELECT id, text, image_url, options FROM {SCHEMA}.pdd_questions WHERE id = ANY(%s)", (q_ids,))
            q_map = {r['id']: dict(r) for r in cur.fetchall()}
            questions = [
                {'id': q_map[qid]['id'], 'text': q_map[qid]['text'], 'image_url': q_map[qid]['image_url'], 'options': q_map[qid]['options']}
                for qid in q_ids if qid in q_map
            ]
            return ok({'session_id': session_id, 'questions': questions})

        if action == 'submit_pdd_test':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            session_id = body.get('session_id')
            answers = body.get('answers') or []
            if not session_id:
                return err('Не указана сессия')
            cur.execute(
                f"SELECT id, instructor_id, total_questions FROM {SCHEMA}.instructor_pdd_tests WHERE id=%s",
                (session_id,)
            )
            session = cur.fetchone()
            if not session or session['instructor_id'] != instr['id']:
                return err('Сессия не найдена', 404)

            q_ids = [a.get('question_id') for a in answers if a.get('question_id')]
            cur.execute(f"SELECT id, correct_index, explanation FROM {SCHEMA}.pdd_questions WHERE id = ANY(%s)", (q_ids,))
            q_map = {r['id']: dict(r) for r in cur.fetchall()}

            correct_count = 0
            results = []
            for a in answers:
                qid = a.get('question_id')
                q = q_map.get(qid)
                if not q:
                    continue
                selected = a.get('selected_index')
                is_correct = selected is not None and int(selected) == q['correct_index']
                if is_correct:
                    correct_count += 1
                results.append({'question_id': qid, 'selected_index': selected, 'correct_index': q['correct_index'], 'is_correct': is_correct, 'explanation': q['explanation']})

            total = session['total_questions'] or len(answers)
            passed = (correct_count / total) >= 0.9 if total else False

            cur.execute(
                f"UPDATE {SCHEMA}.instructor_pdd_tests SET correct_count=%s, passed=%s, finished_at=NOW() WHERE id=%s",
                (correct_count, passed, session_id)
            )

            cur.execute("SELECT date_trunc('month', now())::date as p")
            period = cur.fetchone()['p']
            if passed:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.instructor_kpi (instructor_id, period, pdd_test_passed, pdd_test_points)
                        VALUES (%s,%s,TRUE,20)
                        ON CONFLICT (instructor_id, period) DO UPDATE SET pdd_test_passed=TRUE, pdd_test_points=20, updated_at=NOW()""",
                    (instr['id'], period)
                )
            conn.commit()

            return ok({'correct_count': correct_count, 'total_questions': total, 'passed': passed, 'results': results})

        return err(f'Неизвестное действие: {action}')

    finally:
        cur.close()
        conn.close()