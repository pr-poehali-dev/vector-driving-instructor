import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { ChatMessage } from '@/data/chatData';
import StudentLogin from '@/components/StudentLogin';
import { studentMe, studentLogout } from '@/api/auth';
import { getTopics, DBTopic } from '@/api/content';
import { getAiSettings, sendAiChat } from '@/api/ai';
import { getSiteSettings } from '@/api/siteSettings';
import VectorLogo from '@/components/VectorLogo';
import { useVoiceChat } from '@/hooks/useVoiceChat';


// ─── Водяной знак ────────────────────────────────────────────────────────────
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

// ─── Видеоплеер ──────────────────────────────────────────────────────────────
function VideoPlayer({ url, title, thumb, studentName }: { url: string; title: string; thumb: string; studentName?: string }) {
  const [playing, setPlaying] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // iOS Safari — нативный fullscreen видео вместо CSS
    const onNativeFs = () => {
      // @ts-expect-error webkit-only API on iOS Safari
      if (v.webkitDisplayingFullscreen && v.webkitExitFullscreen) {
        // @ts-expect-error webkit-only API on iOS Safari
        v.webkitExitFullscreen();
      }
      setIsFs(true);
    };
    v.addEventListener('webkitbeginfullscreen', onNativeFs);

    // Android Chrome и др. — стандартный Fullscreen API на самом <video>
    const onDocFsChange = () => {
      const fsEl = document.fullscreenElement as HTMLElement | null;
      if (fsEl && fsEl === v) {
        document.exitFullscreen?.().catch(() => {});
        setIsFs(true);
      }
    };
    document.addEventListener('fullscreenchange', onDocFsChange);
    v.addEventListener('fullscreenchange', onDocFsChange);

    return () => {
      v.removeEventListener('webkitbeginfullscreen', onNativeFs);
      document.removeEventListener('fullscreenchange', onDocFsChange);
      v.removeEventListener('fullscreenchange', onDocFsChange);
    };
  }, [playing]);

  const getYtId = (u: string) => {
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
    return m ? m[1] : null;
  };
  const getRtId = (u: string) => {
    const m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  };
  const ytId = getYtId(url);
  const rtId = getRtId(url);
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
    : rtId
    ? `https://rutube.ru/play/embed/${rtId}`
    : null;

  const player = (
    <div className={`relative bg-black rounded-xl overflow-hidden mt-2.5 ${isFs ? 'fixed inset-0 z-[9999] rounded-none m-0' : ''}`}
      style={{ aspectRatio: isFs ? undefined : '16/9', width: '100%', height: isFs ? '100%' : undefined }}>
      <WatermarkLayer name={studentName || ''} />
      {!playing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group" onClick={() => setPlaying(true)}>
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
      <button onClick={() => setIsFs(f => !f)}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        title={isFs ? 'Свернуть' : 'На весь экран'}>
        <Icon name={isFs ? 'Minimize2' : 'Maximize2'} size={12} />
      </button>
    </div>
  );
  return player;
}

// ─── Изображение ─────────────────────────────────────────────────────────────
function ImageViewer({ src, caption, studentName }: { src: string; caption?: string; studentName?: string }) {
  const [isFs, setIsFs] = useState(false);
  return (
    <div className={`relative mt-2.5 rounded-xl overflow-hidden cursor-pointer ${isFs ? 'fixed inset-0 z-[9999] rounded-none bg-black flex items-center justify-center' : ''}`}
      onClick={() => setIsFs(f => !f)}>
      <WatermarkLayer name={studentName || ''} />
      <img src={src} alt={caption || ''} className={`${isFs ? 'max-h-full max-w-full object-contain' : 'w-full rounded-xl'}`} />
      {caption && !isFs && <p className="text-xs text-gray-500 mt-1 italic">{caption}</p>}
      {isFs && <button className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><Icon name="X" size={16} /></button>}
    </div>
  );
}

// ─── Сообщение ───────────────────────────────────────────────────────────────
function MessageBubble({ message, isNew, studentName }: { message: ChatMessage; isNew?: boolean; studentName?: string }) {
  const isInstructor = message.role === 'instructor';
  return (
    <div className={`flex gap-2.5 ${isInstructor ? 'flex-row' : 'flex-row-reverse'} ${isNew ? 'animate-fade-in' : ''}`}>
      {isInstructor && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold shadow-sm">И</div>
      )}
      <div className={`max-w-[80%] ${isInstructor ? '' : 'items-end'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isInstructor ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm' : 'bg-[#E8002D] text-white rounded-tr-sm'
        }`}>
          {message.text}
          {message.image && <ImageViewer src={message.image.src} caption={message.image.caption} studentName={studentName} />}
          {message.video && (
            <VideoPlayer url={message.video.url} title={message.video.title} thumb={message.video.thumb} studentName={studentName} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Кнопки вариантов ────────────────────────────────────────────────────────
function OptionButtons({ options, onSelect }: { options: string[]; onSelect: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-11 animate-fade-in">
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)}
          className="px-3.5 py-1.5 text-sm rounded-full border border-[#1a1a1a]/20 text-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200 font-medium">
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Конвертация темы из БД ───────────────────────────────────────────────────
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

// ─── Основная страница ────────────────────────────────────────────────────────
export default function ChatPage() {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [dbTopics, setDbTopics] = useState<DBTopic[]>([]);
  const [mode, setMode] = useState<ChatMode>('topics');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'instructor'; text: string; id: string; video?: { title: string; url: string; thumb: string } | null }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiWelcome, setAiWelcome] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [chatTopicsEnabled, setChatTopicsEnabled] = useState(true);
  const [chatAiEnabled, setChatAiEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoiceChat({
    onResult: (text) => { sendAiMessage(text); },
  });

  useEffect(() => {
    studentMe()
      .then(d => { setStudentName(d.name); setStudentId(d.id || null); setAuthState('ok'); })
      .catch(() => setAuthState('login'));
  }, []);

  useEffect(() => {
    if (authState !== 'ok') return;
    const interval = setInterval(() => {
      studentMe().catch(() => {});
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [authState]);

  useEffect(() => {
    getAiSettings().then(s => { if (s.welcome_message) setAiWelcome(s.welcome_message); }).catch(() => {});
  }, []);

  useEffect(() => {
    getSiteSettings()
      .then(s => {
        setChatTopicsEnabled(s.chat_topics_enabled);
        setChatAiEnabled(s.chat_ai_enabled);
        if (!s.chat_topics_enabled && s.chat_ai_enabled) setMode('ai');
        if (s.chat_topics_enabled && !s.chat_ai_enabled) setMode('topics');
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    if (authState !== 'ok') return;
    getTopics().then(data => {
      setDbTopics(data.topics);
      const topicLabels: string[] = data.topics.map((t: DBTopic) => t.label);
      setMessages([{ id: 'welcome', role: 'instructor', text: 'Здравствуйте! Я ваш инструктор автошколы «Вектор». Выберите тему для изучения:', options: topicLabels }]);
      setCurrentOptions(topicLabels);
    }).catch(() => {
      setMessages([{ id: 'welcome', role: 'instructor', text: 'Здравствуйте! Я ваш инструктор.' }]);
    });
  }, [authState]);

  useEffect(() => {
    if (mode === 'ai' && aiMessages.length === 0) {
      const txt = aiWelcome
        ? aiWelcome.replace('{name}', studentName || '').trim()
        : `Привет${studentName ? ', ' + studentName : ''}! 👋 Я ваш AI-инструктор. Задайте любой вопрос про вождение, ПДД или подготовку к экзамену!`;
      setAiMessages([{ id: 'ai-welcome', role: 'instructor', text: txt }]);
    }
  }, [mode, aiWelcome]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, aiMessages, aiLoading]);

  const handleLogout = () => { studentLogout(); setAuthState('login'); };

  // ─── Topics mode ────────────────────────────────────────────────────────────
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
      setIsTyping(true);
      setTimeout(() => {
        const topicMessages = dbTopicToMessages(topic);
        const ids = new Set(topicMessages.map(m => m.id));
        setMessages(prev => [...prev, ...topicMessages]);
        setNewMessageIds(ids);
        const lastOptions = topicMessages.findLast(m => m.options?.length)?.options;
        if (lastOptions?.length) setCurrentOptions(lastOptions);
        setIsTyping(false);
      }, 600);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        const topicLabels = dbTopics.map(t => t.label);
        const fallback: ChatMessage = {
          id: `fallback-${Date.now()}`,
          role: 'instructor',
          text: topicLabels.length ? 'Выберите одну из доступных тем:' : 'Скоро добавим больше тем!',
          options: topicLabels.length ? topicLabels : undefined,
        };
        setMessages(prev => [...prev, fallback]);
        setNewMessageIds(new Set([fallback.id]));
        if (topicLabels.length) setCurrentOptions(topicLabels);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleReset = () => {
    const topicLabels = dbTopics.map(t => t.label);
    setMessages([{ id: 'welcome-reset', role: 'instructor', text: 'Выберите тему:', options: topicLabels }]);
    setCurrentOptions(topicLabels);
    setNewMessageIds(new Set(['welcome-reset']));
  };

  // ─── AI mode ────────────────────────────────────────────────────────────────
  const sendAiMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg = { id: `ai-user-${Date.now()}`, role: 'user' as const, text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    setAiError('');
    const history = aiMessages.filter(m => m.id !== 'ai-welcome').map(m => ({ role: m.role === 'user' ? 'user' : 'instructor', text: m.text }));
    try {
      const data = await sendAiChat(text, history, studentId, studentName);
      if (data.error) throw new Error(data.error);
      setAiMessages(prev => [...prev, { id: `ai-resp-${Date.now()}`, role: 'instructor', text: data.answer, video: data.video || null }]);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Ошибка соединения');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && aiInputRef.current?.value.trim()) {
      const val = aiInputRef.current.value.trim();
      aiInputRef.current.value = '';
      sendAiMessage(val);
    }
  };

  // ─── Экран входа ─────────────────────────────────────────────────────────────
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa]">
        <div className="flex flex-col items-center gap-3">
          <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
          <span className="text-sm text-gray-400">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (settingsLoaded && !chatTopicsEnabled && !chatAiEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a1a] px-6 text-center">
        <VectorLogo size="md" inverted />
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center my-6">
          <Icon name="MessageCircleOff" size={28} className="text-white/40" fallback="XCircle" />
        </div>
        <h2 className="font-montserrat font-bold text-xl text-white mb-2">Чат временно недоступен</h2>
        <p className="text-white/50 text-sm max-w-xs">Инструктор скоро вернётся на связь. Загляните чуть позже.</p>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f6fa]">
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: '#1a1a1a' }}>
          <VectorLogo size="sm" inverted />
          <div className="w-px h-6 bg-white/20" />
          <span className="text-white/60 text-sm">Инструктор онлайн</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#E8002D] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">И</div>
              <h2 className="font-montserrat font-bold text-xl text-[#1a1a1a]">Войдите в аккаунт</h2>
              <p className="text-gray-400 text-sm mt-1">Чат доступен только для учеников автошколы</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <StudentLogin onSuccess={name => { setStudentName(name); setAuthState('ok'); studentMe().then(d => setStudentId(d.id || null)).catch(() => {}); }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Основной чат ─────────────────────────────────────────────────────────────
  return (
    <div className="chat-app-container flex flex-col bg-[#f4f6fa] font-opensans">

      {/* Шапка */}
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
          <p className="text-white font-semibold text-sm font-montserrat">Инструктор Вектор</p>
          <p className="text-white/60 text-xs truncate">
            {mode === 'ai' ? '✨ AI-режим активен' : studentName ? `Привет, ${studentName}` : 'Автошкола • Онлайн'}
          </p>
        </div>
        {mode === 'topics' && (
          <button onClick={handleReset} className="text-white/50 hover:text-white/80 transition-colors p-1.5" title="Начать заново">
            <Icon name="RotateCcw" size={15} />
          </button>
        )}
        <button onClick={handleLogout} className="text-white/50 hover:text-white/80 transition-colors p-1.5" title="Выйти">
          <Icon name="LogOut" size={15} />
        </button>
      </div>

      {/* Переключатель режима */}
      {chatTopicsEnabled && chatAiEnabled && (
        <div className="flex gap-1 px-3 py-2 flex-shrink-0" style={{ background: '#111' }}>
          <button onClick={() => setMode('topics')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'topics' ? 'bg-white text-[#1a1a1a]' : 'text-white/50 hover:text-white/80'
            }`}>
            <Icon name="BookOpen" size={14} />
            Темы
          </button>
          <button onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'ai' ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white/80'
            }`}>
            <Icon name="Sparkles" size={14} />
            AI-инструктор
          </button>
        </div>
      )}

      {/* ── Режим тем ── */}
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
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold">И</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                </div>
              </div>
            )}
            {currentOptions.length > 0 && !isTyping && <OptionButtons options={currentOptions} onSelect={handleOptionSelect} />}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <input ref={inputRef} type="text" placeholder="Введите тему или вопрос..."
              onKeyDown={e => { if (e.key === 'Enter' && inputRef.current?.value.trim()) { handleOptionSelect(inputRef.current.value.trim()); inputRef.current.value = ''; } }}
              className="flex-1 text-sm px-4 py-2.5 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-[#1a1a1a]/40 transition-colors" />
            <button onClick={() => { if (inputRef.current?.value.trim()) { handleOptionSelect(inputRef.current.value.trim()); inputRef.current.value = ''; } }}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#E8002D' }}>
              <Icon name="Send" size={15} className="text-white" />
            </button>
          </div>
        </>
      )}

      {/* ── AI режим ── */}
      {mode === 'ai' && chatAiEnabled && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-4 flex flex-col gap-3">
            {aiMessages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'instructor' ? 'flex-row' : 'flex-row-reverse'}`}>
                {msg.role === 'instructor' && (
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center">
                    <Icon name="Sparkles" size={15} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'instructor' ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm' : 'bg-[#E8002D] text-white rounded-tr-sm'
                }`}>
                  {msg.text}
                  {msg.video && <VideoPlayer url={msg.video.url} title={msg.video.title} thumb={msg.video.thumb} studentName={studentName} />}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center">
                  <Icon name="Sparkles" size={15} className="text-white" />
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
                  <button key={q} onClick={() => sendAiMessage(q)}
                    className="px-3 py-1 text-xs rounded-full border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {voice.supported && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-t border-purple-100 flex-shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setVoiceMode(v => !v)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${voiceMode ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
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

          <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            {voiceMode && voice.supported ? (
              <button
                onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()}
                disabled={aiLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-60 ${
                  voice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500 text-white'
                }`}
              >
                <Icon name={voice.isListening ? 'Square' : 'Mic'} size={16} />
                {voice.isListening ? 'Слушаю... нажмите чтобы остановить' : 'Нажмите и говорите'}
              </button>
            ) : (
              <>
                <input ref={aiInputRef} type="text" placeholder="Задайте любой вопрос про вождение..."
                  onKeyDown={handleAiKeyDown}
                  disabled={aiLoading}
                  className="flex-1 text-sm px-4 py-2.5 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-purple-300 disabled:opacity-60 transition-colors" />
                <button disabled={aiLoading}
                  onClick={() => { if (aiInputRef.current?.value.trim()) { const v = aiInputRef.current.value.trim(); aiInputRef.current.value = ''; sendAiMessage(v); } }}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-60 transition-all"
                  style={{ background: '#7c3aed' }}>
                  <Icon name={aiLoading ? 'Loader' : 'Send'} size={15} className={`text-white ${aiLoading ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}