"""
AI-инструктор автошколы Вектор на базе Groq (llama-3.3-70b).
Бесплатный, очень быстрый. Ключ: console.groq.com
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
- Не упоминай, что ты AI или нейросеть — ты инструктор Вектора
- Отвечай на русском языке"""


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False),
    }


def call_groq(api_key: str, message: str, history: list) -> str:
    url = 'https://api.groq.com/openai/v1/chat/completions'

    # Собираем сообщения в формате OpenAI-совместимого API
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]

    # История диалога (последние 10 сообщений)
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'content': h.get('text', '')})

    # Текущий вопрос
    messages.append({'role': 'user', 'content': message})

    payload = json.dumps({
        'model': 'llama-3.3-70b-versatile',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 512,
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=25) as r:
        result = json.loads(r.read().decode('utf-8'))

    return result['choices'][0]['message']['content']


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

    api_key = os.environ.get('GROQ_API_KEY', '')
    if not api_key:
        return resp({'error': 'AI-инструктор временно недоступен. Обратитесь к администратору.'}, 503)

    try:
        answer = call_groq(api_key, message, history)
        return resp({'answer': answer})
    except urllib.error.HTTPError as e:
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного и попробуйте снова'}, 429)
        if e.code == 401:
            return resp({'error': 'Ошибка авторизации AI. Обратитесь к администратору.'}, 401)
        return resp({'error': 'AI-инструктор временно недоступен, попробуйте позже'}, 502)
    except Exception:
        return resp({'error': 'AI-инструктор временно недоступен, попробуйте позже'}, 502)