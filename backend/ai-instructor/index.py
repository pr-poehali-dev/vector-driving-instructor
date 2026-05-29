"""
AI-инструктор автошколы Вектор на базе YandexGPT.
Российский сервис, серверы в России, работает стабильно.
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


def call_yandexgpt(api_key: str, folder_id: str, message: str, history: list) -> str:
    url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

    messages = [{'role': 'system', 'text': SYSTEM_PROMPT}]
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'text': h.get('text', '')})
    messages.append({'role': 'user', 'text': message})

    payload = json.dumps({
        'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
        'completionOptions': {
            'stream': False,
            'temperature': 0.7,
            'maxTokens': 512,
        },
        'messages': messages,
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Api-Key {api_key}',
            'x-folder-id': folder_id,
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=25) as r:
        result = json.loads(r.read().decode('utf-8'))

    return result['result']['alternatives'][0]['message']['text']


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

    # Диагностика: проверяем секреты и входящие данные
    if action == 'ping':
        api_key = os.environ.get('YANDEX_API_KEY', '')
        folder_id = os.environ.get('YANDEX_FOLDER_ID', '')
        return resp({
            'ok': True,
            'has_api_key': bool(api_key),
            'has_folder_id': bool(folder_id),
            'api_key_prefix': api_key[:8] + '...' if api_key else 'MISSING',
            'folder_id_prefix': folder_id[:8] + '...' if folder_id else 'MISSING',
        })

    if action != 'chat':
        return resp({'error': 'Unknown action', 'received_action': action, 'body_keys': list(body.keys())}, 400)

    message = (body.get('message') or '').strip()
    history = body.get('history') or []

    if not message:
        return resp({'error': 'Сообщение не может быть пустым'}, 400)
    if len(message) > 1000:
        return resp({'error': 'Сообщение слишком длинное'}, 400)

    api_key = os.environ.get('YANDEX_API_KEY', '')
    folder_id = os.environ.get('YANDEX_FOLDER_ID', '')
    if not api_key or not folder_id:
        return resp({'error': 'AI-инструктор не настроен. Обратитесь к администратору.'}, 503)

    try:
        answer = call_yandexgpt(api_key, folder_id, message, history)
        return resp({'answer': answer})
    except urllib.error.HTTPError as e:
        body_err = ''
        try:
            body_err = e.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного'}, 429)
        if e.code == 401:
            return resp({'error': 'Ошибка авторизации. Проверьте API-ключ в настройках.'}, 401)
        if e.code == 400:
            return resp({'error': f'Ошибка запроса: {body_err[:200]}'}, 400)
        return resp({'error': f'Ошибка AI ({e.code}): {body_err[:100]}'}, 502)
    except Exception as e:
        return resp({'error': f'AI-инструктор недоступен: {str(e)[:100]}'}, 502)