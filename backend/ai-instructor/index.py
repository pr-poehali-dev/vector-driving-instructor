"""
AI-инструктор автошколы Вектор на базе GigaChat (Сбер).
Российский сервис, работает без VPN, бесплатный тариф.
POST / — { action: "chat", message: "...", history: [{role, text}] }
"""
import json
import os
import uuid
import urllib.request
import urllib.error
import ssl

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

# SSL-контекст без верификации (нужен для сертификатов Сбера)
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def resp(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False),
    }


def get_gigachat_token(credentials: str) -> str:
    """Получаем access token через OAuth."""
    url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
    payload = 'scope=GIGACHAT_API_PERS'.encode('utf-8')
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': str(uuid.uuid4()),
            'Authorization': f'Basic {credentials}',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=15, context=SSL_CTX) as r:
        result = json.loads(r.read().decode('utf-8'))
    return result['access_token']


def call_gigachat(token: str, message: str, history: list) -> str:
    """Отправляем сообщение в GigaChat."""
    url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in history[-10:]:
        role = 'user' if h.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'content': h.get('text', '')})
    messages.append({'role': 'user', 'content': message})

    payload = json.dumps({
        'model': 'GigaChat',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 512,
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {token}',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=25, context=SSL_CTX) as r:
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

    credentials = os.environ.get('GIGACHAT_CREDENTIALS', '')
    if not credentials:
        return resp({'error': 'AI-инструктор не настроен. Обратитесь к администратору.'}, 503)

    try:
        token = get_gigachat_token(credentials)
        answer = call_gigachat(token, message, history)
        return resp({'answer': answer})
    except urllib.error.HTTPError as e:
        if e.code == 429:
            return resp({'error': 'Слишком много запросов, подождите немного'}, 429)
        if e.code == 401:
            return resp({'error': 'Ошибка авторизации GigaChat. Проверьте ключ.'}, 401)
        return resp({'error': 'AI-инструктор временно недоступен, попробуйте позже'}, 502)
    except Exception as e:
        return resp({'error': 'AI-инструктор временно недоступен, попробуйте позже'}, 502)