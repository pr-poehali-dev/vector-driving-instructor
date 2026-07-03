import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtorType = new () => SpeechRecognitionLike;

interface UseVoiceChatOptions {
  onResult: (text: string) => void;
  lang?: string;
}

export function useVoiceChat({ onResult, lang = 'ru-RU' }: UseVoiceChatOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  const SpeechRecognitionCtor = (win?.SpeechRecognition || win?.webkitSpeechRecognition) as SpeechRecognitionCtorType | undefined;
  const supported = !!SpeechRecognitionCtor;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const text = event.results[event.results.length - 1][0].transcript;
      if (text?.trim()) onResultRef.current(text.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionCtor, lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  return {
    supported,
    isListening,
    startListening,
    stopListening,
  };
}
