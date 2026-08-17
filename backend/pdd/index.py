"""
Раздел ПДД личного кабинета ученика: категории, темы, вопросы, тесты, результаты, ошибки, прогресс.

=== PUBLIC / STUDENT ===
action=get_categories          (публичный) список активных категорий
action=get_topics              category_id            темы категории (для студента, с прогрессом если авторизован)
action=get_topic                topic_id               одна тема с полным содержимым

action=start_test               test_type ('topic'|'category'|'random'|'mistakes'), topic_id?, category_id?, count?
action=submit_test              session_id, answers=[{question_id, selected_index}]
action=get_results              (студент) история сессий тестов
action=get_result_detail        session_id
action=get_mistakes             (студент) список вопросов-ошибок
action=get_progress             (студент) прогресс по категориям

=== ADMIN (can_pdd) ===
action=get_all_categories
action=save_category            id?, slug, label, icon, sort_order, is_active
action=delete_category          id
action=reorder_categories       order=[{id,sort_order}]

action=get_all_topics           category_id?
action=save_topic               id?, category_id, slug, title, content, image_url, sort_order, is_active
action=delete_topic              id
action=reorder_topics           order=[{id,sort_order}]

action=get_questions            topic_id?, category_id?
action=save_question            id?, category_id?, topic_id?, text, image_url, options, correct_index, explanation, difficulty, sort_order, is_active
action=delete_question           id
"""
import json
import os
import random
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


def is_admin_or_manager_pdd(cur, token):
    if is_admin(cur, token):
        return True
    if not token:
        return False
    cur.execute(
        f"""SELECT m.can_pdd FROM {SCHEMA}.manager_sessions ms
            JOIN {SCHEMA}.managers m ON m.id=ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW() AND m.is_active=TRUE""",
        (token,)
    )
    row = cur.fetchone()
    return bool(row and row['can_pdd'])


def question_public(q):
    """Вопрос без правильного ответа (для прохождения теста)."""
    return {'id': q['id'], 'text': q['text'], 'image_url': q['image_url'], 'options': q['options']}


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
        # CATEGORIES (public/admin)
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_categories':
            cur.execute(f"SELECT id, slug, label, icon, sort_order FROM {SCHEMA}.pdd_categories WHERE is_active=TRUE ORDER BY sort_order, id")
            return ok({'categories': [dict(r) for r in cur.fetchall()]})

        if action == 'get_all_categories':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            cur.execute(f"SELECT id, slug, label, icon, sort_order, is_active FROM {SCHEMA}.pdd_categories ORDER BY sort_order, id")
            return ok({'categories': [dict(r) for r in cur.fetchall()]})

        if action == 'save_category':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            cid = body.get('id')
            label = (body.get('label') or '').strip()
            if not label:
                return err('Название обязательно')
            slug = (body.get('slug') or '').strip() or label.lower().replace(' ', '-')
            icon = (body.get('icon') or 'BookOpen').strip()
            sort_order = body.get('sort_order', 0)
            is_active = body.get('is_active', True)
            if cid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.pdd_categories SET slug=%s, label=%s, icon=%s, sort_order=%s, is_active=%s
                        WHERE id=%s RETURNING id, slug, label, icon, sort_order, is_active""",
                    (slug, label, icon, sort_order, is_active, cid)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.pdd_categories (slug, label, icon, sort_order, is_active)
                        VALUES (%s,%s,%s,%s,%s) RETURNING id, slug, label, icon, sort_order, is_active""",
                    (slug, label, icon, sort_order, is_active)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'category': dict(row)})

        if action == 'delete_category':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            cid = body.get('id')
            if not cid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.pdd_categories SET is_active=FALSE WHERE id=%s", (cid,))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_categories':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            for item in (body.get('order') or []):
                cur.execute(f"UPDATE {SCHEMA}.pdd_categories SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # TOPICS (public/admin)
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_topics':
            category_id = body.get('category_id')
            student = get_student(cur, token)
            where = "WHERE t.is_active=TRUE"
            params = []
            if category_id:
                where += " AND t.category_id=%s"
                params.append(category_id)
            cur.execute(
                f"""SELECT t.id, t.category_id, t.slug, t.title, t.image_url, t.sort_order,
                           COALESCE(p.status, 'not_started') as status, COALESCE(p.best_score_percent, 0) as best_score_percent
                    FROM {SCHEMA}.pdd_topics t
                    LEFT JOIN {SCHEMA}.student_pdd_progress p ON p.topic_id=t.id AND p.student_id=%s
                    {where} ORDER BY t.sort_order, t.id""",
                [student['id'] if student else None] + params
            )
            return ok({'topics': [dict(r) for r in cur.fetchall()]})

        if action == 'get_all_topics':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            category_id = body.get('category_id')
            where = ''
            params = []
            if category_id:
                where = 'WHERE category_id=%s'
                params.append(category_id)
            cur.execute(
                f"SELECT id, category_id, slug, title, content, image_url, sort_order, is_active FROM {SCHEMA}.pdd_topics {where} ORDER BY sort_order, id",
                params
            )
            return ok({'topics': [dict(r) for r in cur.fetchall()]})

        if action == 'get_topic':
            tid = body.get('topic_id')
            if not tid:
                return err('Не указана тема')
            cur.execute(
                f"""SELECT t.id, t.category_id, t.slug, t.title, t.content, t.image_url, c.label as category_label
                    FROM {SCHEMA}.pdd_topics t JOIN {SCHEMA}.pdd_categories c ON c.id=t.category_id
                    WHERE t.id=%s AND t.is_active=TRUE""",
                (tid,)
            )
            row = cur.fetchone()
            if not row:
                return err('Тема не найдена', 404)
            cur.execute(f"SELECT COUNT(*) as cnt FROM {SCHEMA}.pdd_questions WHERE topic_id=%s AND is_active=TRUE", (tid,))
            qcount = cur.fetchone()['cnt']
            topic = dict(row)
            topic['question_count'] = qcount
            return ok({'topic': topic})

        if action == 'save_topic':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            tid = body.get('id')
            category_id = body.get('category_id')
            title = (body.get('title') or '').strip()
            if not title or not category_id:
                return err('Категория и заголовок обязательны')
            slug = (body.get('slug') or '').strip() or title.lower().replace(' ', '-')
            content = body.get('content') or ''
            image_url = body.get('image_url') or None
            sort_order = body.get('sort_order', 0)
            is_active = body.get('is_active', True)
            if tid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.pdd_topics SET category_id=%s, slug=%s, title=%s, content=%s, image_url=%s, sort_order=%s, is_active=%s
                        WHERE id=%s RETURNING id, category_id, slug, title, content, image_url, sort_order, is_active""",
                    (category_id, slug, title, content, image_url, sort_order, is_active, tid)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.pdd_topics (category_id, slug, title, content, image_url, sort_order, is_active)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id, category_id, slug, title, content, image_url, sort_order, is_active""",
                    (category_id, slug, title, content, image_url, sort_order, is_active)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'topic': dict(row)})

        if action == 'delete_topic':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            tid = body.get('id')
            if not tid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.pdd_topics SET is_active=FALSE WHERE id=%s", (tid,))
            conn.commit()
            return ok({'ok': True})

        if action == 'reorder_topics':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            for item in (body.get('order') or []):
                cur.execute(f"UPDATE {SCHEMA}.pdd_topics SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # QUESTIONS (admin)
        # ══════════════════════════════════════════════════════════════════

        if action == 'get_questions':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            topic_id = body.get('topic_id')
            category_id = body.get('category_id')
            where, params = [], []
            if topic_id:
                where.append('topic_id=%s')
                params.append(topic_id)
            if category_id:
                where.append('category_id=%s')
                params.append(category_id)
            where_sql = f"WHERE {' AND '.join(where)}" if where else ''
            cur.execute(
                f"""SELECT id, category_id, topic_id, text, image_url, options, correct_index, explanation, difficulty, sort_order, is_active
                    FROM {SCHEMA}.pdd_questions {where_sql} ORDER BY sort_order, id""",
                params
            )
            return ok({'questions': [dict(r) for r in cur.fetchall()]})

        if action == 'save_question':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            qid = body.get('id')
            text = (body.get('text') or '').strip()
            options = body.get('options') or []
            if not text or len(options) < 2:
                return err('Текст вопроса и минимум 2 варианта ответа обязательны')
            correct_index = int(body.get('correct_index', 0))
            if correct_index < 0 or correct_index >= len(options):
                return err('Некорректный индекс правильного ответа')
            category_id = body.get('category_id') or None
            topic_id = body.get('topic_id') or None
            image_url = body.get('image_url') or None
            explanation = body.get('explanation') or ''
            difficulty = int(body.get('difficulty', 1))
            sort_order = body.get('sort_order', 0)
            is_active = body.get('is_active', True)
            options_json = json.dumps(options, ensure_ascii=False)
            if qid:
                cur.execute(
                    f"""UPDATE {SCHEMA}.pdd_questions SET category_id=%s, topic_id=%s, text=%s, image_url=%s, options=%s,
                        correct_index=%s, explanation=%s, difficulty=%s, sort_order=%s, is_active=%s
                        WHERE id=%s RETURNING id, category_id, topic_id, text, image_url, options, correct_index, explanation, difficulty, sort_order, is_active""",
                    (category_id, topic_id, text, image_url, options_json, correct_index, explanation, difficulty, sort_order, is_active, qid)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.pdd_questions (category_id, topic_id, text, image_url, options, correct_index, explanation, difficulty, sort_order, is_active)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id, category_id, topic_id, text, image_url, options, correct_index, explanation, difficulty, sort_order, is_active""",
                    (category_id, topic_id, text, image_url, options_json, correct_index, explanation, difficulty, sort_order, is_active)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'question': dict(row)})

        if action == 'delete_question':
            if not is_admin_or_manager_pdd(cur, token):
                return err('Доступ запрещён', 403)
            qid = body.get('id')
            if not qid:
                return err('Не указан id')
            cur.execute(f"UPDATE {SCHEMA}.pdd_questions SET is_active=FALSE WHERE id=%s", (qid,))
            conn.commit()
            return ok({'ok': True})

        # ══════════════════════════════════════════════════════════════════
        # TESTS (student)
        # ══════════════════════════════════════════════════════════════════

        if action == 'start_test':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            test_type = body.get('test_type', 'topic')
            topic_id = body.get('topic_id')
            category_id = body.get('category_id')
            count = min(int(body.get('count', 20)), 50)

            if test_type == 'topic':
                if not topic_id:
                    return err('Не указана тема')
                cur.execute(f"SELECT id FROM {SCHEMA}.pdd_questions WHERE topic_id=%s AND is_active=TRUE", (topic_id,))
                q_ids = [r['id'] for r in cur.fetchall()]
            elif test_type == 'category':
                if not category_id:
                    return err('Не указана категория')
                cur.execute(f"SELECT id FROM {SCHEMA}.pdd_questions WHERE category_id=%s AND is_active=TRUE", (category_id,))
                q_ids = [r['id'] for r in cur.fetchall()]
                random.shuffle(q_ids)
                q_ids = q_ids[:count]
            elif test_type == 'mistakes':
                cur.execute(
                    f"""SELECT question_id FROM {SCHEMA}.student_mistakes
                        WHERE student_id=%s AND resolved=FALSE""",
                    (student['id'],)
                )
                q_ids = [r['question_id'] for r in cur.fetchall()]
                if not q_ids:
                    return err('Ошибок пока нет — отлично!')
            else:  # random
                cur.execute(f"SELECT id FROM {SCHEMA}.pdd_questions WHERE is_active=TRUE")
                q_ids = [r['id'] for r in cur.fetchall()]
                random.shuffle(q_ids)
                q_ids = q_ids[:count]

            if not q_ids:
                return err('Вопросов не найдено')

            cur.execute(
                f"""INSERT INTO {SCHEMA}.test_sessions (student_id, test_type, topic_id, category_id, total_questions)
                    VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                (student['id'], test_type, topic_id, category_id, len(q_ids))
            )
            session_id = cur.fetchone()['id']
            conn.commit()

            cur.execute(
                f"SELECT id, text, image_url, options FROM {SCHEMA}.pdd_questions WHERE id = ANY(%s)",
                (q_ids,)
            )
            q_map = {r['id']: dict(r) for r in cur.fetchall()}
            questions = [question_public(q_map[qid]) for qid in q_ids if qid in q_map]
            return ok({'session_id': session_id, 'questions': questions})

        if action == 'submit_test':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            session_id = body.get('session_id')
            answers = body.get('answers') or []
            if not session_id:
                return err('Не указана сессия')
            cur.execute(
                f"SELECT id, student_id, topic_id, test_type, total_questions FROM {SCHEMA}.test_sessions WHERE id=%s",
                (session_id,)
            )
            session = cur.fetchone()
            if not session or session['student_id'] != student['id']:
                return err('Сессия не найдена', 404)

            q_ids = [a.get('question_id') for a in answers if a.get('question_id')]
            cur.execute(
                f"SELECT id, text, image_url, options, correct_index, explanation FROM {SCHEMA}.pdd_questions WHERE id = ANY(%s)",
                (q_ids,)
            )
            q_map = {r['id']: dict(r) for r in cur.fetchall()}

            results = []
            correct_count = 0
            for a in answers:
                qid = a.get('question_id')
                q = q_map.get(qid)
                if not q:
                    continue
                selected = a.get('selected_index')
                is_correct = selected is not None and int(selected) == q['correct_index']
                if is_correct:
                    correct_count += 1
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.test_answers (session_id, question_id, selected_index, is_correct)
                        VALUES (%s,%s,%s,%s)""",
                    (session_id, qid, selected, is_correct)
                )
                if not is_correct:
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.student_mistakes (student_id, question_id, times_wrong, last_wrong_at, resolved)
                            VALUES (%s,%s,1,NOW(),FALSE)
                            ON CONFLICT (student_id, question_id)
                            DO UPDATE SET times_wrong = {SCHEMA}.student_mistakes.times_wrong + 1, last_wrong_at=NOW(), resolved=FALSE""",
                        (student['id'], qid)
                    )
                else:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.student_mistakes SET resolved=TRUE WHERE student_id=%s AND question_id=%s""",
                        (student['id'], qid)
                    )
                results.append({
                    'question_id': qid, 'text': q['text'], 'image_url': q['image_url'], 'options': q['options'],
                    'correct_index': q['correct_index'], 'selected_index': selected, 'is_correct': is_correct,
                    'explanation': q['explanation'],
                })

            total = session['total_questions'] or len(answers)
            passed_threshold = 0.9  # соответствует проходному баллу экзамена ГИБДД (не более 2 ошибок из 20)
            passed = (correct_count / total) >= passed_threshold if total else False

            cur.execute(
                f"UPDATE {SCHEMA}.test_sessions SET correct_count=%s, passed=%s, finished_at=NOW() WHERE id=%s",
                (correct_count, passed, session_id)
            )

            if session['topic_id']:
                score_percent = round(100 * correct_count / total) if total else 0
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.student_pdd_progress (student_id, topic_id, status, best_score_percent, updated_at)
                        VALUES (%s,%s,'completed',%s,NOW())
                        ON CONFLICT (student_id, topic_id)
                        DO UPDATE SET status='completed', best_score_percent=GREATEST({SCHEMA}.student_pdd_progress.best_score_percent, %s), updated_at=NOW()""",
                    (student['id'], session['topic_id'], score_percent, score_percent)
                )

            conn.commit()
            return ok({
                'session_id': session_id, 'total': total, 'correct_count': correct_count,
                'passed': passed, 'results': results,
            })

        if action == 'get_results':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            limit = min(int(body.get('limit', 50)), 200)
            cur.execute(
                f"""SELECT ts.id, ts.test_type, ts.total_questions, ts.correct_count, ts.passed, ts.started_at, ts.finished_at,
                           t.title as topic_title, c.label as category_label
                    FROM {SCHEMA}.test_sessions ts
                    LEFT JOIN {SCHEMA}.pdd_topics t ON t.id=ts.topic_id
                    LEFT JOIN {SCHEMA}.pdd_categories c ON c.id=ts.category_id
                    WHERE ts.student_id=%s AND ts.finished_at IS NOT NULL
                    ORDER BY ts.finished_at DESC LIMIT %s""",
                (student['id'], limit)
            )
            return ok({'results': [dict(r) for r in cur.fetchall()]})

        if action == 'get_result_detail':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            session_id = body.get('session_id')
            cur.execute(
                f"SELECT id, student_id, test_type, total_questions, correct_count, passed, started_at, finished_at FROM {SCHEMA}.test_sessions WHERE id=%s",
                (session_id,)
            )
            session = cur.fetchone()
            if not session or session['student_id'] != student['id']:
                return err('Не найдено', 404)
            cur.execute(
                f"""SELECT ta.question_id, ta.selected_index, ta.is_correct,
                           q.text, q.image_url, q.options, q.correct_index, q.explanation
                    FROM {SCHEMA}.test_answers ta JOIN {SCHEMA}.pdd_questions q ON q.id=ta.question_id
                    WHERE ta.session_id=%s ORDER BY ta.id""",
                (session_id,)
            )
            answers = [dict(r) for r in cur.fetchall()]
            return ok({'session': dict(session), 'answers': answers})

        if action == 'get_mistakes':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            cur.execute(
                f"""SELECT m.question_id, m.times_wrong, m.last_wrong_at,
                           q.text, q.image_url, q.options, q.correct_index, q.explanation
                    FROM {SCHEMA}.student_mistakes m JOIN {SCHEMA}.pdd_questions q ON q.id=m.question_id
                    WHERE m.student_id=%s AND m.resolved=FALSE
                    ORDER BY m.last_wrong_at DESC""",
                (student['id'],)
            )
            return ok({'mistakes': [dict(r) for r in cur.fetchall()]})

        if action == 'get_progress':
            student = get_student(cur, token)
            if not student:
                return err('Требуется авторизация', 401)
            cur.execute(
                f"""SELECT c.id, c.label,
                           COUNT(t.id) as total_topics,
                           COUNT(p.id) FILTER (WHERE p.status='completed') as completed_topics,
                           COALESCE(AVG(p.best_score_percent) FILTER (WHERE p.status='completed'), 0) as avg_score
                    FROM {SCHEMA}.pdd_categories c
                    LEFT JOIN {SCHEMA}.pdd_topics t ON t.category_id=c.id AND t.is_active=TRUE
                    LEFT JOIN {SCHEMA}.student_pdd_progress p ON p.topic_id=t.id AND p.student_id=%s
                    WHERE c.is_active=TRUE
                    GROUP BY c.id, c.label ORDER BY c.sort_order, c.id""",
                (student['id'],)
            )
            categories = []
            for r in cur.fetchall():
                d = dict(r)
                d['percent'] = round(100 * d['completed_topics'] / d['total_topics']) if d['total_topics'] else 0
                d['avg_score'] = round(float(d['avg_score']))
                categories.append(d)
            overall = round(sum(c['percent'] for c in categories) / len(categories)) if categories else 0
            return ok({'categories': categories, 'overall_percent': overall})

        return err('Unknown action', 400)
    finally:
        cur.close()
        conn.close()
