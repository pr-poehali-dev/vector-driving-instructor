import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { ChatMessage } from '@/data/chatData';
import SupportModal from '@/components/SupportModal';
import { getTopics, DBTopic, logTopicView } from '@/api/content';
import { getAiSettings, sendAiChat } from '@/api/ai';
import { getSiteSettings } from '@/api/siteSettings';
import { quizQuestion, quizAnswer, TestQuestion } from '@/api/pdd';
import { createSupportTicket } from '@/api/support';
import { useVoiceChat } from '@/hooks/useVoiceChat';

function WatermarkLayer({ name }: { name: string }) {
  if (!name) return null;
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 2147483647 }}>
      <div className="absolute top-3 left-3">
        <span className="text-white/60 text-xs font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}>{name}</span>
      </div>
      <div className="absolute bottom-3 right-3">
        <span className="text-white/60 text-xs font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}>{name}</span>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg]">
        <span className="text-white/25 text-sm font-semibold whitespace-nowrap" style={{ userSelect: 'none' }}>{name}</span>
      </div>
    </div>
  );
}

const activeVideoListeners = new Set<(id: symbol) => void>();
function notifyVideoStarted(id: symbol) {
  activeVideoListeners.forEach(fn => fn(id));
}

function VideoPlayer({ url, title, thumb, studentName }: { url: string; title: string; thumb: string; studentName?: string }) {
  const [playing, setPlaying] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const idRef = useRef(Symbol('video'));

  useEffect(() => {
    const onOtherStarted = (id: symbol) => {
      if (id !== idRef.current) setPlaying(false);
    };
    activeVideoListeners.add(onOtherStarted);
    return () => { activeVideoListeners.delete(onOtherStarted); };
  }, []);

  const handlePlay = () => {
    notifyVideoStarted(idRef.current);
    setPlaying(true);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onNativeFs = () => {
      // @ts-expect-error webkit-only API on iOS Safari
      if (v.webkitDisplayingFullscreen && v.webkitExitFullscreen) {
        // @ts-expect-error webkit-only API on iOS Safari
        v.webkitExitFullscreen();
      }
      setIsFs(true);
    };
    v.addEventListener('webkitbeginfullscreen', onNativeFs);
    const onDocFsChange = () => {
      const fsEl = document.fullscreenElement as HTMLElement | null;
      if (fsEl && fsEl === v) {
        document.exitFullscreen?.().catch(() => {});
        setIsFs(true);
      }
    };
    document.addEventListener('fullscreenchange', onDocFsChange);
    return () => {
      v.removeEventListener('webkitbeginfullscreen', onNativeFs);
      document.removeEventListener('fullscreenchange', onDocFsChange);
    };
  }, [playing]);

  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  const rtMatch = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const embedUrl = ytMatch
    ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    : rtMatch
    ? `https://rutube.ru/play/embed/${rtMatch[1]}`
    : null;

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden mt-2.5 ${isFs ? 'fixed inset-0 z-[9999] rounded-none m-0' : 'w-full max-w-full'}`}
      style={{ aspectRatio: isFs ? undefined : '16/9', width: isFs ? '100%' : undefined, height: isFs ? '100%' : undefined }}
    >
      <WatermarkLayer name={studentName || ''} />
      {!playing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group" onClick={handlePlay}>
          {thumb ? <img src={thumb} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-70" /> : <div className="absolute inset-0 bg-gray-900" />}
          <div className="relative z-10 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Icon name="Play" size={20} className="text-[#1a1a1a] ml-0.5" />
          </div>
          {title && <p className="relative z-10 mt-2 text-white text-xs font-medium px-4 text-center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{title}</p>}
        </div>
      ) : embedUrl ? (
        <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="autoplay" title={title} />
      ) : isVideo ? (
        <video
          ref={videoRef}
          src={url}
          autoPlay
          controls
          controlsList="nofullscreen nodownload noremoteplayback"
          disablePictureInPicture
          playsInline
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          className="absolute inset-0 w-full h-full"
        />
      ) : null}
      <button
        onClick={() => setIsFs(f => !f)}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        title={isFs ? 'Свернуть' : 'На весь экран'}
      >
        <Icon name={isFs ? 'Minimize2' : 'Maximize2'} size={12} />
      </button>
    </div>
  );
}

function ImageViewer({ src, caption, studentName }: { src: string; caption?: string; studentName?: string }) {
  const [isFs, setIsFs] = useState(false);
  return (
    <div
      className={`relative mt-2.5 rounded-xl overflow-hidden cursor-pointer ${isFs ? 'fixed inset-0 z-[9999] rounded-none bg-black flex items-center justify-center' : ''}`}
      onClick={() => setIsFs(f => !f)}
    >
      <WatermarkLayer name={studentName || ''} />
      <img src={src} alt={caption || ''} className={isFs ? 'max-h-full max-w-full object-contain' : 'w-full rounded-xl'} />
      {caption && !isFs && <p className="text-xs text-gray-500 mt-1 italic">{caption}</p>}
      {isFs && <button className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><Icon name="X" size={16} /></button>}
    </div>
  );
}

function MessageBubble({ message, isNew, studentName }: { message: ChatMessage; isNew?: boolean; studentName?: string }) {
  const isInstructor = message.role === 'instructor';
  return (
    <div className={`flex gap-2.5 ${isInstructor ? 'flex-row' : 'flex-row-reverse'} ${isNew ? 'animate-fade-in' : ''}`}>
      {isInstructor && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold shadow-sm">И</div>
      )}
      <div className="max-w-[85%] min-w-0">
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isInstructor ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm' : 'bg-[#E8002D] text-white rounded-tr-sm'
        }`}>
          {message.text}
          {message.image && <ImageViewer src={message.image.src} caption={message.image.caption} studentName={studentName} />}
          {message.video && <VideoPlayer url={message.video.url} title={message.video.title} thumb={message.video.thumb} studentName={studentName} />}
        </div>
      </div>
    </div>
  );
}

function OptionButtons({ options, onSelect }: { options: string[]; onSelect: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-10 animate-fade-in">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 text-sm rounded-full border border-[#1a1a1a]/20 text-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200 font-medium"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function dbTopicToMessages(topic: DBTopic): ChatMessage[] {
  return topic.messages.map(m => ({
    id: `db-${m.id}`,
    role: 'instructor' as const,
    text: m.text,
    video: m.video_url ? { title: m.video_title || '', url: m.video_url, thumb: m.video_thumb || '' } : undefined,
    image: m.image_url ? { src: m.image_url, caption: m.image_caption || '' } : undefined,
    options: m.options?.length ? m.options : undefined,
  }));
}

type ChatMode = 'topics' | 'ai';
type AiMessage = {
  role: 'user' | 'instructor';
  text: string;
  id: string;
  videos?: { title: string; url: string; thumb: string; description?: string }[];
  quiz?: {
    question: TestQuestion;
    selected?: number;
    result?: { is_correct: boolean; correct_index: number; explanation: string };
  };
  feedback?: { options: string[]; chosen?: string };
};

const FEEDBACK_KEY = 'vector_feedback_asked_';

const QUIZ_INTROS = [
  'Давайте проверим себя, небольшой вопрос:',
  'Пока вы смотрите видео, вопрос на внимательность:',
  'Быстрый вопрос, чтобы не терять форму:',
];
const FIRST_QUIZ_DELAY_MS = 3 * 60 * 1000;
const NEXT_QUIZ_DELAY_MS = 7 * 60 * 1000;

interface Props {
  studentId: number | null;
  studentName: string;
  visible: boolean;
  onProactive: () => void;
  onClose: () => void;
}

export default function InstructorChat({ studentId, studentName, visible, onProactive, onClose }: Props) {
  const [dbTopics, setDbTopics] = useState<DBTopic[]>([]);
  const [mode, setMode] = useState<ChatMode>('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiWelcome, setAiWelcome] = useState('');
  const [chatTopicsEnabled, setChatTopicsEnabled] = useState(true);
  const [chatAiEnabled, setChatAiEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const seenQuizIds = useRef<number[]>([]);
  const awaitingRemark = useRef(false);
  const busyRef = useRef(false);
  const visibleRef = useRef(visible);
  const onProactiveRef = useRef(onProactive);
  busyRef.current = aiLoading || aiMessages.some(m => m.quiz && m.quiz.selected === undefined);
  visibleRef.current = visible;
  onProactiveRef.current = onProactive;

  const voice = useVoiceChat({
    onResult: (text) => { sendAiMessage(text); },
  });

  useEffect(() => {
    getAiSettings().then(s => { if (s.welcome_message) setAiWelcome(s.welcome_message); }).catch(() => {});
  }, []);

  useEffect(() => {
    getSiteSettings()
      .then(s => {
        setChatTopicsEnabled(s.chat_topics_enabled);
        setChatAiEnabled(s.chat_ai_enabled);
        if (!s.chat_ai_enabled && s.chat_topics_enabled) setMode('topics');
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    getTopics().then(data => {
      setDbTopics(data.topics);
      const labels: string[] = data.topics.map((t: DBTopic) => t.label);
      setMessages([{ id: 'welcome', role: 'instructor', text: 'Выберите тему для изучения:', options: labels }]);
      setCurrentOptions(labels);
    }).catch(() => {
      setMessages([{ id: 'welcome', role: 'instructor', text: 'Здравствуйте! Я ваш инструктор.' }]);
    });
  }, []);

  useEffect(() => {
    if (mode === 'ai' && aiMessages.length === 0) {
      const txt = aiWelcome
        ? aiWelcome.replace('{name}', studentName || '').trim()
        : `Привет${studentName ? ', ' + studentName : ''}! Я ваш виртуальный инструктор. Смотрите видео и спрашивайте всё, что непонятно: про вождение, ПДД или экзамен.`;
      setAiMessages([{ id: 'ai-welcome', role: 'instructor', text: txt }]);
    }
  }, [mode, aiWelcome]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, aiMessages, aiLoading, mode, visible]);

  const askQuiz = async () => {
    try {
      const { question } = await quizQuestion(seenQuizIds.current);
      seenQuizIds.current = [...seenQuizIds.current, question.id];
      const intro = QUIZ_INTROS[seenQuizIds.current.length % QUIZ_INTROS.length];
      setAiMessages(prev => [...prev, { id: `quiz-${Date.now()}`, role: 'instructor', text: intro, quiz: { question } }]);
      if (!visibleRef.current) onProactiveRef.current();
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (!settingsLoaded || !chatAiEnabled) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = (ms: number) => {
      t = setTimeout(async () => {
        if (busyRef.current || awaitingRemark.current) {
          schedule(60 * 1000);
          return;
        }
        await askQuiz();
        schedule(NEXT_QUIZ_DELAY_MS);
      }, ms);
    };
    schedule(FIRST_QUIZ_DELAY_MS);
    return () => clearTimeout(t);
  }, [settingsLoaded, chatAiEnabled]);

  const askFeedbackOnce = () => {
    const key = FEEDBACK_KEY + (studentId ?? 'x');
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        id: `fb-${Date.now()}`,
        role: 'instructor',
        text: 'Кстати, как у вас проходит обучение? Всё ли нравится?',
        feedback: { options: ['Всё отлично', 'Есть пожелания'] },
      }]);
    }, 2500);
  };

  const answerQuiz = async (msgId: string, idx: number) => {
    const msg = aiMessages.find(m => m.id === msgId);
    if (!msg?.quiz || msg.quiz.selected !== undefined) return;
    setAiMessages(prev => prev.map(m => (m.id === msgId && m.quiz ? { ...m, quiz: { ...m.quiz, selected: idx } } : m)));
    try {
      const r = await quizAnswer(msg.quiz.question.id, idx);
      const right = msg.quiz.question.options[r.correct_index];
      const reply = r.is_correct
        ? `Верно! ${r.explanation}`.trim()
        : `Не совсем. Правильный ответ: ${right}. ${r.explanation}`.trim();
      setAiMessages(prev => [
        ...prev.map(m => (m.id === msgId && m.quiz ? { ...m, quiz: { ...m.quiz, result: r } } : m)),
        { id: `quiz-reply-${Date.now()}`, role: 'instructor' as const, text: reply },
      ]);
      askFeedbackOnce();
    } catch (err: unknown) {
      setAiMessages(prev => prev.map(m => (m.id === msgId && m.quiz ? { ...m, quiz: { ...m.quiz, selected: undefined } } : m)));
      setAiError(err instanceof Error ? err.message : 'Ошибка соединения');
    }
  };

  const chooseFeedback = (msgId: string, option: string) => {
    const good = option === 'Всё отлично';
    if (!good) awaitingRemark.current = true;
    setAiMessages(prev => [
      ...prev.map(m => (m.id === msgId && m.feedback ? { ...m, feedback: { ...m.feedback, chosen: option } } : m)),
      { id: `fb-user-${Date.now()}`, role: 'user' as const, text: option },
      {
        id: `fb-reply-${Date.now()}`,
        role: 'instructor' as const,
        text: good
          ? 'Рад слышать! Если что-то захотите улучшить, просто напишите мне.'
          : 'Расскажите, что можно улучшить. Я передам это администрации.',
      },
    ]);
  };

  const handleOptionSelect = (option: string) => {
    const optLower = option.toLowerCase();
    const topic = dbTopics.find(t => {
      if (t.label.toLowerCase() === optLower) return true;
      if (!t.tags) return false;
      return t.tags.split(',').map(s => s.trim().toLowerCase()).some(tag => tag && optLower.includes(tag));
    });
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: option };
    setMessages(prev => [...prev, userMsg]);
    setCurrentOptions([]);
    setNewMessageIds(new Set([userMsg.id]));

    if (topic) {
      logTopicView(topic.label, studentId, studentName);
      setIsTyping(true);
      setTimeout(() => {
        const topicMessages = dbTopicToMessages(topic);
        setMessages(prev => [...prev, ...topicMessages]);
        setNewMessageIds(new Set(topicMessages.map(m => m.id)));
        const lastOptions = [...topicMessages].reverse().find(m => m.options?.length)?.options;
        if (lastOptions?.length) setCurrentOptions(lastOptions);
        setIsTyping(false);
      }, 600);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        const labels = dbTopics.map(t => t.label);
        const fallback: ChatMessage = {
          id: `fallback-${Date.now()}`,
          role: 'instructor',
          text: labels.length ? 'Выберите одну из доступных тем:' : 'Скоро добавим больше тем!',
          options: labels.length ? labels : undefined,
        };
        setMessages(prev => [...prev, fallback]);
        setNewMessageIds(new Set([fallback.id]));
        if (labels.length) setCurrentOptions(labels);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleReset = () => {
    const labels = dbTopics.map(t => t.label);
    setMessages([{ id: 'welcome-reset', role: 'instructor', text: 'Выберите тему:', options: labels }]);
    setCurrentOptions(labels);
    setNewMessageIds(new Set(['welcome-reset']));
  };

  const sendAiMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg: AiMessage = { id: `ai-user-${Date.now()}`, role: 'user', text };
    if (awaitingRemark.current) {
      awaitingRemark.current = false;
      createSupportTicket(`Отзыв об обучении: ${text}`, studentId, studentName).catch(() => {});
      setAiMessages(prev => [
        ...prev,
        userMsg,
        { id: `fb-thanks-${Date.now()}`, role: 'instructor' as const, text: 'Спасибо! Передал администрации.' },
      ]);
      return;
    }
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    setAiError('');
    const history = aiMessages.filter(m => m.id !== 'ai-welcome').map(m => ({ role: m.role === 'user' ? 'user' : 'instructor', text: m.text }));
    try {
      const data = await sendAiChat(text, history, studentId, studentName);
      if (data.error) throw new Error(data.error);
      const videos = data.videos && data.videos.length > 0 ? data.videos : (data.video ? [data.video] : []);
      setAiMessages(prev => [...prev, { id: `ai-resp-${Date.now()}`, role: 'instructor', text: data.answer, videos }]);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Ошибка соединения');
    } finally {
      setAiLoading(false);
    }
  };

  const submitAi = () => {
    const el = aiInputRef.current;
    if (el && el.value.trim()) {
      const v = el.value.trim();
      el.value = '';
      sendAiMessage(v);
    }
  };

  const submitTopic = () => {
    const el = inputRef.current;
    if (el && el.value.trim()) {
      const v = el.value.trim();
      el.value = '';
      handleOptionSelect(v);
    }
  };

  const unavailable = settingsLoaded && !chatTopicsEnabled && !chatAiEnabled;

  return (
    <div className="flex flex-col h-full bg-[#f4f6fa] font-opensans">
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#1a1a1a' }}>
        <div className="relative w-9 h-9 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#E8002D] flex items-center justify-center text-white font-bold text-sm">И</div>
          {mode === 'ai' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <Icon name="Sparkles" size={9} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm font-montserrat">Виртуальный инструктор</p>
          <p className="text-white/60 text-xs truncate">Спросите, пока смотрите видео</p>
        </div>
        {mode === 'topics' && (
          <button onClick={handleReset} className="text-white/50 hover:text-white/80 transition-colors p-1.5" title="Начать заново">
            <Icon name="RotateCcw" size={15} />
          </button>
        )}
        <button onClick={() => setShowSupport(true)} className="text-white/50 hover:text-white/80 transition-colors p-1.5" title="Написать в поддержку">
          <Icon name="LifeBuoy" size={15} />
        </button>
        <button onClick={onClose} className="text-white/50 hover:text-white/80 transition-colors p-1.5" title="Закрыть чат">
          <Icon name="X" size={17} />
        </button>
      </div>

      {showSupport && <SupportModal studentId={studentId} studentName={studentName} onClose={() => setShowSupport(false)} />}

      {unavailable ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Icon name="XCircle" size={32} className="text-gray-300 mb-3" />
          <p className="font-montserrat font-bold text-[#1a1a1a] mb-1">Чат временно недоступен</p>
          <p className="text-gray-400 text-sm">Инструктор скоро вернётся на связь. Загляните чуть позже.</p>
        </div>
      ) : (
        <>
          {chatTopicsEnabled && chatAiEnabled && (
            <div className="flex gap-1 px-3 py-2 flex-shrink-0" style={{ background: '#111' }}>
              <button
                onClick={() => setMode('ai')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'ai' ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon name="Sparkles" size={14} />Задать вопрос
              </button>
              <button
                onClick={() => setMode('topics')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'topics' ? 'bg-white text-[#1a1a1a]' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon name="BookOpen" size={14} />Темы
              </button>
            </div>
          )}

          {mode === 'topics' && chatTopicsEnabled && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-4 flex flex-col gap-3">
                {messages.map(msg => (
                  <div key={msg.id}>
                    <MessageBubble message={msg} isNew={newMessageIds.has(msg.id)} studentName={studentName} />
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2.5 animate-fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold">И</div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                    </div>
                  </div>
                )}
                {currentOptions.length > 0 && !isTyping && <OptionButtons options={currentOptions} onSelect={handleOptionSelect} />}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Введите тему или вопрос..."
                  onKeyDown={e => { if (e.key === 'Enter') submitTopic(); }}
                  className="flex-1 min-w-0 text-base sm:text-sm px-4 py-2.5 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-[#1a1a1a]/40 transition-colors"
                />
                <button onClick={submitTopic} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E8002D' }}>
                  <Icon name="Send" size={15} className="text-white" />
                </button>
              </div>
            </>
          )}

          {mode === 'ai' && chatAiEnabled && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-4 flex flex-col gap-3">
                {aiMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'instructor' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {msg.role === 'instructor' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <Icon name="Sparkles" size={14} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'instructor' ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm' : 'bg-[#E8002D] text-white rounded-tr-sm'
                    }`}>
                      {msg.text}
                      {msg.videos?.map((v, i) => (
                        <div key={v.url + i} className={i > 0 ? 'mt-3' : ''}>
                          {v.description && <p className="text-sm leading-relaxed mb-1">{v.description}</p>}
                          <VideoPlayer url={v.url} title={v.title} thumb={v.thumb} studentName={studentName} />
                        </div>
                      ))}
                      {msg.quiz && (
                        <div className="mt-2.5">
                          <p className="font-semibold text-[#1a1a1a] mb-2">{msg.quiz.question.text}</p>
                          {msg.quiz.question.image_url && (
                            <img src={msg.quiz.question.image_url} alt="" className="w-full rounded-xl mb-2 border border-gray-100" />
                          )}
                          <div className="flex flex-col gap-1.5">
                            {msg.quiz.question.options.map((opt, i) => {
                              const res = msg.quiz!.result;
                              const picked = msg.quiz!.selected === i;
                              const cls = res
                                ? i === res.correct_index
                                  ? 'border-green-400 bg-green-50 text-green-800'
                                  : picked
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-gray-200 text-gray-400'
                                : picked
                                ? 'border-purple-300 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
                              return (
                                <button
                                  key={i}
                                  disabled={msg.quiz!.selected !== undefined}
                                  onClick={() => answerQuiz(msg.id, i)}
                                  className={`text-left text-sm px-3 py-2 rounded-xl border transition-colors ${cls}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {msg.feedback && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {msg.feedback.options.map(o => (
                            <button
                              key={o}
                              disabled={!!msg.feedback!.chosen}
                              onClick={() => chooseFeedback(msg.id, o)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                msg.feedback!.chosen === o
                                  ? 'border-purple-400 bg-purple-50 text-purple-700'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50'
                              }`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex gap-2.5 animate-fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <Icon name="Sparkles" size={14} className="text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                    </div>
                  </div>
                )}
                {aiError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs animate-fade-in">
                    <Icon name="AlertCircle" size={13} />{aiError}
                  </div>
                )}
              </div>

              {aiMessages.length <= 1 && (
                <div className="px-4 py-2.5 bg-[#f4f6fa] border-t border-gray-100 flex flex-col gap-1.5 flex-shrink-0">
                  <p className="text-xs text-gray-400 font-medium">Быстрые вопросы:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Как правильно парковаться?', 'Как сдать экзамен ГИБДД?', 'Что такое помеха справа?', 'Как вести себя при заносе?'].map(q => (
                      <button
                        key={q}
                        onClick={() => sendAiMessage(q)}
                        className="px-3 py-1 text-xs rounded-full border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {voice.supported && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-t border-purple-100 flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setVoiceMode(v => !v)} className={`w-9 h-5 rounded-full relative transition-colors ${voiceMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: voiceMode ? '18px' : '2px' }} />
                    </div>
                    <span className="text-xs font-medium text-purple-700">Голосовой режим</span>
                  </label>
                </div>
              )}

              {voiceMode && voice.error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
                  <Icon name="AlertCircle" size={13} className="text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600">{voice.error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                {voiceMode && voice.supported ? (
                  <button
                    onClick={() => (voice.isListening ? voice.stopListening() : voice.startListening())}
                    disabled={aiLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-60 ${
                      voice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500 text-white'
                    }`}
                  >
                    <Icon name={voice.isListening ? 'Square' : 'Mic'} size={16} />
                    {voice.isListening ? 'Слушаю... нажмите, чтобы остановить' : 'Нажмите и говорите'}
                  </button>
                ) : (
                  <>
                    <input
                      ref={aiInputRef}
                      type="text"
                      placeholder="Задайте вопрос по видео или вождению..."
                      onKeyDown={e => { if (e.key === 'Enter') submitAi(); }}
                      disabled={aiLoading}
                      className="flex-1 min-w-0 text-base sm:text-sm px-4 py-2.5 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-purple-300 disabled:opacity-60 transition-colors"
                    />
                    <button
                      disabled={aiLoading}
                      onClick={submitAi}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-60 transition-all"
                      style={{ background: '#7c3aed' }}
                    >
                      <Icon name={aiLoading ? 'Loader' : 'Send'} size={15} className={`text-white ${aiLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}