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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  const SpeechRecognitionCtor = (win?.SpeechRecognition || win?.webkitSpeechRecognition) as SpeechRecognitionCtorType | undefined;
  const supportsRecognition = !!SpeechRecognitionCtor;
  const supportsSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

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

  const speak = useCallback((text: string) => {
    if (!supportsSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang?.toLowerCase().startsWith('ru'));
    if (ruVoice) utter.voice = ruVoice;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [lang, supportsSynthesis]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    supported: supportsRecognition && supportsSynthesis,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
