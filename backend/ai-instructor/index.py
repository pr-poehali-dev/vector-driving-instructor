"""
AI-инструктор автошколы Вектор на базе Google Gemini.
Отвечает на вопросы учеников строго в роли опытного инструктора по вождению.
POST / — { action: "chat", message: "...", history: [{role, text}] }
"""
import json
import os
import urllib.request
import urllib.error

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

SYSTEM_PROMPT = """Ты — опытный инструктор по вождению автошколы «Вектор» (г. Курган).
Твоя задача — помогать ученикам изучать правила дорожного движения и технику вождения.

Правила общения:
- Отвечай ТОЛЬКО на темы, связанные с вождением, ПДД, автомобилями, автошколой
- Если вопрос не по теме вождения — вежливо перенаправь: «Я инструктор по вождению, могу помочь только с вопросами про ПДД и технику вождения»
- Говори как профессиональный, но доброжелательный инструктор
- Используй простой язык, без лишних технических терминов
- Давай конкретные практические советы
- При необходимости — объясняй пошагово
- Отвечай кратко (3-6 предложений), если вопрос не требует подробного разбора
- Можешь использовать эмодзи для наглядности: 🚗 📌 ⚠️ ✅
- Не упоминай, что ты AI или нейросеть — ты инструктор Вектора"""


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False),
    }


def call_gemini(api_key: str, message: str, history: list) -> str:
    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}'

    # Строим contents: сначала system в user-turn, затем история, затем текущий вопрос
    contents = []

    # Системный промпт как первый user-turn
    contents.append({
        'role': 'user',
        'parts': [{'text': SYSTEM_PROMPT}]
    })
    contents.append({
        'role': 'model',
        'parts': [{'text': 'Понял. Я готов помогать ученикам автошколы «Вектор» как инструктор по вождению.'}]
    })

    # История диалога (последние 10 сообщений)
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'model'
        contents.append({'role': role, 'parts': [{'text': h.get('text', '')}]})

    # Текущий вопрос
    contents.append({'role': 'user', 'parts': [{'text': message}]})

    payload = json.dumps({
        'contents': contents,
        'generationConfig': {
            'temperature': 0.7,
            'maxOutputTokens': 512,
        }
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=20) as r:
        result = json.loads(r.read().decode('utf-8'))

    return result['candidates'][0]['content']['parts'][0]['text']


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

    if action != 'chat':
        return resp({'error': 'Unknown action'}, 400)

    message = (body.get('message') or '').strip()
    history = body.get('history') or []

    if not message:
        return resp({'error': 'Сообщение не может быть пустым'}, 400)
    if len(message) > 1000:
        return resp({'error': 'Сообщение слишком длинное'}, 400)

    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        return resp({'error': 'AI-инструктор временно недоступен'}, 503)

    try:
        answer = call_gemini(api_key, message, history)
        return resp({'answer': answer})
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного и попробуйте снова'}, 429)
        if e.code == 400:
            return resp({'error': 'Некорректный запрос к AI'}, 400)
        return resp({'error': f'Ошибка AI: {e.code}'}, 502)
    except Exception:
        return resp({'error': 'AI-инструктор временно недоступен, попробуйте позже'}, 502)
