import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtorType = new () => SpeechRecognitionLike;

interface UseVoiceChatOptions {
  onResult: (text: string) => void;
  lang?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.',
  'permission-denied': 'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.',
  'no-speech': 'Речь не распознана. Попробуйте ещё раз.',
  'audio-capture': 'Микрофон не найден. Проверьте подключение.',
  'network': 'Проблема с сетью. Проверьте соединение.',
  'aborted': '',
};

export function useVoiceChat({ onResult, lang = 'ru-RU' }: UseVoiceChatOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  const SpeechRecognitionCtor = (win?.SpeechRecognition || win?.webkitSpeechRecognition) as SpeechRecognitionCtorType | undefined;
  const isSecure = typeof window === 'undefined' || window.isSecureContext !== false;
  const supported = !!SpeechRecognitionCtor && isSecure;

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor || isListening) return;
    setError('');

    try {
      recognitionRef.current?.abort?.();
    } catch {
      // ignore
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const results = event.results;
      if (!results || results.length === 0) return;
      const text = results[results.length - 1]?.[0]?.transcript;
      if (text?.trim()) onResultRef.current(text.trim());
    };
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const msg = ERROR_MESSAGES[event.error] ?? 'Не удалось распознать речь. Попробуйте ещё раз.';
      if (msg) setError(msg);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setError('Не удалось запустить микрофон. Попробуйте ещё раз.');
    }
  }, [SpeechRecognitionCtor, lang, isListening]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  return {
    supported,
    isListening,
    error,
    startListening,
    stopListening,
  };
}
