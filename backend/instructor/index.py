"""
Личный кабинет инструктора (мастера производственного обучения вождению).

=== AUTH ===
action=login              login, password
action=me
action=logout
action=change_password    old_password, new_password

=== KPI ===
action=get_kpi            period?  (возвращает kpi мастера + branch_ranking всех филиалов + my_branch)

=== VIDEO REGISTRATOR (S3) ===
action=upload_video       shift_date, file_name, content_base64  (загрузка файла в S3 reg-45)
action=get_archive        сгруппированный по датам список загруженных видео
action=get_video_url      video_id  (временная ссылка на просмотр видео, 1 час)

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

S3_BUCKET = 'reg-45'
S3_ENDPOINT = 'https://s3.cloud.ru'
S3_REGION = 'ru-central-1'


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


def s3_client():
    # Cloud.ru требует составной Access Key ID в формате "tenant_id:key_id"
    access_key = f"{os.environ['REG45_S3_TENANT_ID']}:{os.environ['REG45_S3_ACCESS_KEY']}"
    return boto3.client(
        's3', endpoint_url=S3_ENDPOINT, region_name=S3_REGION,
        aws_access_key_id=access_key,
        aws_secret_access_key=os.environ['REG45_S3_SECRET_KEY'],
    )


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


def scale_reviews_exams(n):
    """Шкала для 'Отзывы' и 'Экзамены': 10+ = 15; 8–9 = 13; 6–7 = 11; 4–5 = 8; 2–3 = 5; 1 = 2; 0 = 0"""
    if n >= 10: return 15
    if n >= 8: return 13
    if n >= 6: return 11
    if n >= 4: return 8
    if n >= 2: return 5
    if n == 1: return 2
    return 0


def scale_pass_percent(exams, passed):
    """Шкала для '% сдачи': 90%+=25; 80-89=22; 70-79=19; 60-69=16; 50-59=12; 40-49=8; <40=4"""
    if exams == 0:
        return 0, 0
    pct = passed / exams
    if pct >= 0.9: pts = 25
    elif pct >= 0.8: pts = 22
    elif pct >= 0.7: pts = 19
    elif pct >= 0.6: pts = 16
    elif pct >= 0.5: pts = 12
    elif pct >= 0.4: pts = 8
    else: pts = 4
    return round(pct * 100), pts


def scale_upgrades(n):
    """Шкала для 'Повышения пакета': 5+=10; 4=9; 3=7; 2=5; 1=3; 0=0"""
    if n >= 5: return 10
    if n == 4: return 9
    if n == 3: return 7
    if n == 2: return 5
    if n == 1: return 3
    return 0


def compute_kpi_row(row):
    """Считает баллы из сырых фактов ровно по формулам оригинальной Excel-таблицы мотивации."""
    reviews_pts = scale_reviews_exams(row['reviews'])
    exams_pts = scale_reviews_exams(row['exams'])
    pass_percent, pass_pts = scale_pass_percent(row['exams'], row['passed'])
    upgrades_pts = scale_upgrades(row['package_upgrades_n'])
    pdd_pts = 20 if row['pdd_status'] == 'Сдал' else 0
    discipline = max(0, min(10, row['discipline']))
    service = max(0, min(5, row['service']))
    total = reviews_pts + exams_pts + pass_pts + upgrades_pts + pdd_pts + discipline + service
    return {
        'period': row['period'],
        'reviews': row['reviews'], 'reviews_points': reviews_pts,
        'exams': row['exams'], 'exams_points': exams_pts,
        'passed': row['passed'], 'pass_percent': pass_percent, 'pass_points': pass_pts,
        'package_upgrades': row['package_upgrades_n'], 'upgrades_points': upgrades_pts,
        'pdd_status': row['pdd_status'], 'pdd_points': pdd_pts,
        'discipline': discipline, 'service': service,
        'note': row['note'],
        'total_score': total,
    }


def kpi_public(row):
    if not row:
        return None
    return compute_kpi_row(row)


def compute_branch_ranking(cur, period, schema):
    """Рейтинг филиалов ("Кубок филиала") — формулы 1-в-1 из листа 'Рейтинг филиалов' Excel:
    итог = ср.рейтинг мастеров*30% + %сдачи*25% + min(отзывы/мастер/10,1)*15% + min(экзамены/мастер/10,1)*10%
           + min(повышения/мастер/5,1)*10% + доля ПДД сдали*10%
    """
    cur.execute(
        f"""SELECT i.branch_id, b.name as branch_name, k.reviews, k.exams, k.passed, k.package_upgrades_n, k.pdd_status
            FROM {schema}.instructors i
            JOIN {schema}.branches b ON b.id = i.branch_id
            LEFT JOIN {schema}.instructor_kpi k ON k.instructor_id = i.id AND k.period = %s
            WHERE i.is_active = TRUE AND i.branch_id IS NOT NULL""",
        (period,)
    )
    rows = cur.fetchall()

    branches = {}
    for r in rows:
        bid = r['branch_id']
        if bid not in branches:
            branches[bid] = {'branch_id': bid, 'branch_name': r['branch_name'], 'masters': []}
        reviews = r['reviews'] or 0
        exams = r['exams'] or 0
        passed = r['passed'] or 0
        upgrades = r['package_upgrades_n'] or 0
        pdd_status = r['pdd_status'] or ''
        total_score = compute_kpi_row({
            'period': period, 'reviews': reviews, 'exams': exams, 'passed': passed,
            'package_upgrades_n': upgrades, 'pdd_status': pdd_status,
            'discipline': 10, 'service': 5, 'note': '',
        })['total_score']
        branches[bid]['masters'].append({
            'total_score': total_score, 'reviews': reviews, 'exams': exams,
            'passed': passed, 'upgrades': upgrades, 'pdd_passed': pdd_status == 'Сдал',
        })

    result = []
    for bid, data in branches.items():
        masters = data['masters']
        n = len(masters) or 1
        avg_rating = sum(m['total_score'] for m in masters) / n
        total_exams = sum(m['exams'] for m in masters)
        total_passed = sum(m['passed'] for m in masters)
        pass_percent = (total_passed / total_exams) if total_exams else 0
        reviews_per_master = sum(m['reviews'] for m in masters) / n
        exams_per_master = sum(m['exams'] for m in masters) / n
        upgrades_per_master = sum(m['upgrades'] for m in masters) / n
        pdd_share = sum(1 for m in masters if m['pdd_passed']) / n

        final_score = (
            avg_rating * 0.30
            + pass_percent * 100 * 0.25
            + min(reviews_per_master / 10, 1) * 100 * 0.15
            + min(exams_per_master / 10, 1) * 100 * 0.10
            + min(upgrades_per_master / 5, 1) * 100 * 0.10
            + pdd_share * 100 * 0.10
        )
        result.append({
            'branch_id': bid, 'branch_name': data['branch_name'],
            'avg_rating': round(avg_rating, 1), 'pass_percent': round(pass_percent * 100),
            'reviews_per_master': round(reviews_per_master, 1), 'exams_per_master': round(exams_per_master, 1),
            'upgrades_per_master': round(upgrades_per_master, 1), 'pdd_share': round(pdd_share * 100),
            'final_score': round(final_score, 1), 'masters_count': len(masters),
        })

    result.sort(key=lambda x: x['final_score'], reverse=True)
    for idx, r in enumerate(result):
        r['rank'] = idx + 1
    return result


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

        if action == 'change_password':
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            old_password = (body.get('old_password') or '').strip()
            new_password = (body.get('new_password') or '').strip()
            if not old_password or not new_password:
                return err('Заполните оба поля')
            if len(new_password) < 4:
                return err('Новый пароль минимум 4 символа')
            cur.execute(f"SELECT password_hash FROM {SCHEMA}.instructors WHERE id=%s", (instr['id'],))
            row = cur.fetchone()
            if not row or row['password_hash'] != hash_pw(old_password):
                return err('Текущий пароль неверный', 401)
            cur.execute(f"UPDATE {SCHEMA}.instructors SET password_hash=%s, plain_password=%s WHERE id=%s", (hash_pw(new_password), new_password, instr['id']))
            # Завершаем все остальные сессии на других устройствах кроме текущей
            cur.execute(f"UPDATE {SCHEMA}.instructor_sessions SET expires_at=NOW() WHERE instructor_id=%s AND token!=%s", (instr['id'], token))
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
            kpi = kpi_public(row)
            if kpi:
                cur.execute(f"SELECT * FROM {SCHEMA}.instructor_kpi WHERE period=%s", (period,))
                all_rows = cur.fetchall()
                totals = sorted((compute_kpi_row(r)['total_score'] for r in all_rows), reverse=True)
                kpi['rank'] = totals.index(kpi['total_score']) + 1 if kpi['total_score'] in totals else None
                kpi['rank_total'] = len(totals)

            branch_ranking = compute_branch_ranking(cur, period, SCHEMA)
            my_branch = next((b for b in branch_ranking if b['branch_id'] == instr['branch_id']), None)
            return ok({'kpi': kpi, 'branch_ranking': branch_ranking, 'my_branch': my_branch})

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

            s3 = s3_client()
            s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=file_bytes, ContentType=content_type)
            s3_url = f"{S3_ENDPOINT}/{S3_BUCKET}/{s3_key}"

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

        if action == 'get_video_url':
            # Временная ссылка для просмотра видео прямо в браузере (без скачивания файла на диск)
            instr = get_instructor(cur, token)
            if not instr:
                return err('Требуется авторизация', 401)
            video_id = body.get('video_id')
            if not video_id:
                return err('Не указан video_id')
            cur.execute(
                f"SELECT s3_key FROM {SCHEMA}.instructor_video_uploads WHERE id=%s AND instructor_id=%s",
                (video_id, instr['id'])
            )
            row = cur.fetchone()
            if not row:
                return err('Видео не найдено', 404)
            s3 = s3_client()
            url = s3.generate_presigned_url('get_object', Params={'Bucket': S3_BUCKET, 'Key': row['s3_key']}, ExpiresIn=3600)
            return ok({'url': url})

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
                    f"""INSERT INTO {SCHEMA}.instructor_kpi (instructor_id, period, pdd_status)
                        VALUES (%s,%s,'Сдал')
                        ON CONFLICT (instructor_id, period) DO UPDATE SET pdd_status='Сдал', updated_at=NOW()""",
                    (instr['id'], period)
                )
            conn.commit()

            return ok({'correct_count': correct_count, 'total_questions': total, 'passed': passed, 'results': results})

        return err(f'Неизвестное действие: {action}')

    finally:
        cur.close()
        conn.close()