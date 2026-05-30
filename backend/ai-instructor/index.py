"""
AI-инструктор автошколы Вектор — YandexGPT.
POST / { action: "chat", message: "...", history: [{role, text}] }
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

FOLDER_ID = os.environ.get('YANDEX_FOLDER_ID', 'b1g0sotnrm9uvrj7aeu6')

SYSTEM_PROMPT = """Ты — опытный инструктор по вождению автошколы «Вектор» (г. Курган).
Помогай ученикам изучать ПДД и технику вождения.
- Отвечай ТОЛЬКО на темы вождения, ПДД, автомобилей
- Если вопрос не по теме — скажи: «Я инструктор по вождению, помогу только с вопросами про ПДД и вождение»
- Говори как доброжелательный профессиональный инструктор
- Простой язык, конкретные практические советы
- Кратко (3-6 предложений), при необходимости пошагово
- Эмодзи: 🚗 📌 ⚠️ ✅
- Не упоминай что ты AI — ты инструктор Вектора
- Отвечай только на русском языке"""


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False),
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

    if action == 'ping':
        api_key = os.environ.get('YANDEX_API_KEY', '') or os.environ.get('YANDEX_FOLDER_ID', '')
        return resp({
            'ok': True,
            'has_key': bool(api_key and api_key.startswith('AQVN')),
            'folder_id': FOLDER_ID,
        })

    if action != 'chat':
        return resp({'error': 'Unknown action'}, 400)

    message = (body.get('message') or '').strip()
    history = body.get('history') or []

    if not message:
        return resp({'error': 'Сообщение не может быть пустым'}, 400)
    if len(message) > 1000:
        return resp({'error': 'Сообщение слишком длинное'}, 400)

    # Ключ может лежать в любом из двух полей
    api_key = os.environ.get('YANDEX_API_KEY', '')
    if not api_key:
        api_key = os.environ.get('YANDEX_FOLDER_ID', '')
    if not api_key or not api_key.startswith('AQVN'):
        return resp({'error': 'AI-инструктор не настроен. Обратитесь к администратору.'}, 503)

    # Формируем сообщения
    messages = [{'role': 'system', 'text': SYSTEM_PROMPT}]
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'text': h.get('text', '')})
    messages.append({'role': 'user', 'text': message})

    payload = json.dumps({
        'modelUri': f'gpt://{FOLDER_ID}/yandexgpt-lite',
        'completionOptions': {
            'stream': False,
            'temperature': 0.7,
            'maxTokens': 512,
        },
        'messages': messages,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Api-Key {api_key}',
            'x-folder-id': FOLDER_ID,
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            result = json.loads(r.read().decode('utf-8'))
        answer = result['result']['alternatives'][0]['message']['text']
        return resp({'answer': answer})
    except urllib.error.HTTPError as e:
        err = ''
        try:
            err = e.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        print(f'YandexGPT HTTP error {e.code}: {err[:500]}')
        if e.code == 401:
            return resp({'error': f'Ошибка авторизации (401). Ключ не подходит к Yandex Cloud API. Детали: {err[:200]}'}, 200)
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного'}, 200)
        return resp({'error': f'Ошибка YandexGPT {e.code}: {err[:300]}'}, 200)
    except Exception as e:
        print(f'YandexGPT exception: {str(e)}')
        return resp({'error': f'Ошибка соединения: {str(e)[:200]}'}, 200)