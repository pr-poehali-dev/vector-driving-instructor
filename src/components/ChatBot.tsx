import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { ChatMessage } from '@/data/chatData';
import StudentLogin from '@/components/StudentLogin';
import SupportModal from '@/components/SupportModal';
import { studentMe, studentLogout } from '@/api/auth';
import { getTopics, DBTopic, logTopicView } from '@/api/content';
import { getAiSettings, sendAiChat } from '@/api/ai';
import { getSiteSettings } from '@/api/siteSettings';
import { useVoiceChat } from '@/hooks/useVoiceChat';


function WatermarkLayer({ name }: { name: string }) {
  if (!name) return null;
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 2147483647 }}>
      <div className="absolute top-3 left-3">
        <span className="text-white/60 text-xs font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', letterSpacing: '0.05em', userSelect: 'none' }}>{name}</span>
      </div>
      <div className="absolute bottom-3 right-3">
        <span className="text-white/60 text-xs font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', letterSpacing: '0.05em', userSelect: 'none' }}>{name}</span>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg]">
        <span className="text-white/25 text-sm font-semibold whitespace-nowrap" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}>{name}</span>
      </div>
    </div>
  );
}

interface VideoPlayerProps { url: string; title: string; thumb: string; studentName?: string }

function VideoPlayer({ url, title, thumb, studentName }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const watermark = studentName || '';

  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement as HTMLElement | null;
      // Если в нативный fullscreen ушёл сам <video> (Android Chrome), а не наша обёртка —
      // выходим из него и переключаемся на свой fullscreen с водяным знаком
      if (fsEl && videoRef.current && fsEl === videoRef.current) {
        document.exitFullscreen?.().catch(() => {});
        setIsFs(true);
        return;
      }
      setIsFs(!!fsEl);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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
    return () => v.removeEventListener('webkitbeginfullscreen', onNativeFs);
  }, [playing]);

  const handleFullscreen = () => {
    if (wrapperRef.current?.requestFullscreen) wrapperRef.current.requestFullscreen();
  };
  const handleExitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
  };

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-white/20 w-64 max-w-full" onContextMenu={e => e.preventDefault()}>
      {!playing ? (
        <div className="relative cursor-pointer group" onClick={() => setPlaying(true)}>
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-36 object-cover" onContextMenu={e => e.preventDefault()} />
          ) : (
            <div className="w-full h-36 bg-gray-800 flex items-center justify-center">
              <Icon name="Video" size={32} className="text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#E8002D] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Icon name="Play" size={20} className="text-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white text-xs font-medium line-clamp-1 drop-shadow">{title}</p>
          </div>
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="relative w-full bg-black"
          style={isFs ? { width: '100vw', height: '100vh' } : { aspectRatio: '16/9' }}
          onContextMenu={e => e.preventDefault()}
        >
          {isDirectVideo ? (
            <video
              ref={videoRef}
              className="w-full h-full"
              autoPlay
              controls
              controlsList="nodownload noremoteplayback nofullscreen"
              disablePictureInPicture
              playsInline
              webkit-playsinline="true"
            >
              <source src={url} />
            </video>
          ) : (
            <iframe
              src={url.includes('rutube.ru') ? url : `${url}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />
          )}
          <WatermarkLayer name={watermark} />
          <button
            onClick={isFs ? handleExitFullscreen : handleFullscreen}
            className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded p-1.5 transition-colors"
            style={{ zIndex: 2147483646 }}
            title={isFs ? 'Свернуть' : 'На весь экран'}
          >
            <Icon name={isFs ? 'Minimize' : 'Maximize'} size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function ImageViewer({ src, caption, studentName }: { src: string; caption: string; studentName?: string }) {
  const [isFs, setIsFs] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const watermark = studentName || '';

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleFullscreen = () => {
    if (wrapperRef.current?.requestFullscreen) wrapperRef.current.requestFullscreen();
  };
  const handleExitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
  };

  return (
    <div
      ref={wrapperRef}
      className="mt-2 rounded-lg overflow-hidden select-none relative"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={isFs ? { background: '#000', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
    >
      <img
        src={src}
        alt={caption}
        className={isFs ? 'max-w-full max-h-full object-contain' : 'w-full'}
        draggable={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      />
      <WatermarkLayer name={watermark} />
      <button
        onClick={isFs ? handleExitFullscreen : handleFullscreen}
        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded p-1.5 transition-colors"
        style={{ zIndex: 2147483646 }}
        title={isFs ? 'Свернуть' : 'На весь экран'}
      >
        <Icon name={isFs ? 'Minimize' : 'Maximize'} size={14} />
      </button>
      {caption && !isFs && (
        <p className="text-xs text-gray-500 mt-1 italic px-1 pb-1">{caption}</p>
      )}
      {caption && isFs && (
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none select-none">
          <span className="text-white/60 text-xs italic">{caption}</span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, isNew, studentName }: { message: ChatMessage; isNew?: boolean; studentName?: string }) {
  const isInstructor = message.role === 'instructor';
  return (
    <div className={`flex gap-2.5 ${isInstructor ? 'flex-row' : 'flex-row-reverse'} ${isNew ? 'animate-fade-in' : ''}`}>
      {isInstructor && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold shadow-sm">
          И
        </div>
      )}
      <div className={`max-w-[85%] ${isInstructor ? '' : 'items-end'}`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isInstructor
            ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
            : 'bg-[#E8002D] text-white rounded-tr-sm'
        }`}>
          {message.text}
          {message.image && (
            <ImageViewer src={message.image.src} caption={message.image.caption} studentName={studentName} />
          )}
          {message.video && (
            <VideoPlayer url={message.video.url} title={message.video.title} thumb={message.video.thumb} studentName={studentName} />
          )}
        </div>
      </div>
    </div>
  );
}

function OptionButtons({ options, onSelect }: { options: string[]; onSelect: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-10 animate-fade-in">
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)}
          className="px-3 py-1.5 text-xs rounded-full border border-[#1a1a1a]/20 text-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200 font-medium">
          {opt}
        </button>
      ))}
    </div>
  );
}

// Конвертируем тему из БД в ChatMessage[]
function dbTopicToMessages(topic: DBTopic): ChatMessage[] {
  return topic.messages.map(m => ({
    id: `db-${m.id}`,
    role: 'instructor' as const,
    text: m.text,
    video: m.video_url ? { title: m.video_title || '', url: m.video_url, thumb: m.video_thumb || '', is360: m.is_360 } : undefined,
    image: m.image_url ? { src: m.image_url, caption: m.image_caption || '' } : undefined,
    options: m.options?.length ? m.options : undefined,
  }));
}

type ChatMode = 'topics' | 'ai';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [dbTopics, setDbTopics] = useState<DBTopic[]>([]);
  const [mode, setMode] = useState<ChatMode>('topics');

  // topics mode state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // ai mode state
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'instructor'; text: string; id: string; videos?: { title: string; url: string; thumb: string; description?: string }[] }[]>([]);
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

  const voice = useVoiceChat({
    onResult: (text) => { sendAiMessage(text); },
  });

  // Загружаем настройки чата (какие боты включены)
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

  // Загружаем темы из БД
  useEffect(() => {
    getTopics().then(data => {
      setDbTopics(data.topics);
      const topicLabels: string[] = data.topics.map((t: DBTopic) => t.label);
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'instructor',
        text: 'Здравствуйте! Я ваш инструктор автошколы «Вектор». Выберите тему для изучения:',
        options: topicLabels,
      };
      setMessages([welcome]);
      setCurrentOptions(topicLabels);
    }).catch(() => {
      setMessages([{ id: 'welcome', role: 'instructor', text: 'Здравствуйте! Я ваш инструктор.' }]);
    });
  }, []);

  // Загружаем приветствие из настроек AI
  useEffect(() => {
    getAiSettings().then(s => {
      if (s.welcome_message) setAiWelcome(s.welcome_message);
    }).catch(() => {});
  }, []);

  // Инициализируем AI-режим приветствием
  useEffect(() => {
    if (mode === 'ai' && aiMessages.length === 0) {
      const welcomeText = aiWelcome
        ? aiWelcome.replace('{name}', studentName || '').replace('  ', ' ').trim()
        : `Привет${studentName ? ', ' + studentName : ''}! 👋 Я ваш AI-инструктор. Задайте любой вопрос про вождение, ПДД или подготовку к экзамену — отвечу подробно!`;
      setAiMessages([{ id: 'ai-welcome', role: 'instructor', text: welcomeText }]);
    }
  }, [mode, aiWelcome]);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, aiMessages, aiLoading]);

  const handleLogout = () => {
    studentLogout();
    setAuthState('login');
    setIsOpen(false);
  };

  // ─── Topics mode ────────────────────────────────────────────────────────────
  const handleOptionSelect = (option: string) => {
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: option };
    setMessages(prev => [...prev, userMsg]);
    setCurrentOptions([]);
    setIsTyping(true);
    setNewMessageIds(prev => new Set([...prev, userMsg.id]));

    const optLower = option.toLowerCase();
    const topic = dbTopics.find(t => {
      if (t.label.toLowerCase() === optLower) return true;
      if (!t.tags) return false;
      return t.tags.split(',').map(s => s.trim().toLowerCase()).some(tag => tag && optLower.includes(tag));
    });
    if (topic) {
      logTopicView(topic.label, studentId, studentName);
      const topicMsgs = dbTopicToMessages(topic);
      let delay = 800;
      topicMsgs.forEach((msg, i) => {
        setTimeout(() => {
          setIsTyping(i < topicMsgs.length - 1);
          setMessages(prev => [...prev, msg]);
          setNewMessageIds(prev => new Set([...prev, msg.id]));
          if (i === topicMsgs.length - 1) setCurrentOptions(msg.options || []);
        }, delay);
        delay += msg.video ? 1800 : msg.image ? 1400 : 1000;
      });
    } else {
      setTimeout(() => {
        const topicLabels = dbTopics.map(t => t.label);
        const fallback: ChatMessage = {
          id: `fallback-${Date.now()}`, role: 'instructor',
          text: 'Выберите тему из списка — расскажу подробно.',
          options: topicLabels,
        };
        setMessages(prev => [...prev, fallback]);
        setCurrentOptions(topicLabels);
        setIsTyping(false);
        setNewMessageIds(prev => new Set([...prev, fallback.id]));
      }, 900);
    }
  };

  const handleReset = () => {
    const topicLabels = dbTopics.map(t => t.label);
    const welcome: ChatMessage = {
      id: 'welcome', role: 'instructor',
      text: 'Здравствуйте! Выберите тему для изучения:',
      options: topicLabels,
    };
    setMessages([welcome]);
    setCurrentOptions(topicLabels);
    setIsTyping(false);
    setNewMessageIds(new Set(['welcome']));
  };

  // ─── AI mode ─────────────────────────────────────────────────────────────────
  const sendAiMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg = { id: `ai-user-${Date.now()}`, role: 'user' as const, text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    setAiError('');

    const history = aiMessages
      .filter(m => m.id !== 'ai-welcome')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'instructor', text: m.text }));

    try {
      const data = await sendAiChat(text, history, studentId, studentName);
      if (data.error) throw new Error(data.error);
      const videos = data.videos && data.videos.length > 0 ? data.videos : (data.video ? [data.video] : []);
      setAiMessages(prev => [...prev, {
        id: `ai-resp-${Date.now()}`,
        role: 'instructor',
        text: data.answer,
        videos,
      }]);
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

  // ─── Floating button ─────────────────────────────────────────────────────────
  const floatingBtn = (
    <button data-chatbot-btn onClick={() => setIsOpen(true)}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 pulse-red ${
        isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
      }`}
      style={{ background: '#E8002D' }}>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Icon name="MessageCircle" size={16} className="text-white" />
      </div>
      <span className="text-white font-semibold text-sm font-montserrat pr-1">Спросить инструктора</span>
    </button>
  );

  if (settingsLoaded && !chatTopicsEnabled && !chatAiEnabled) return null;

  if (authState === 'checking') return floatingBtn;

  // ─── Login screen ─────────────────────────────────────────────────────────────
  if (authState === 'login') {
    return (
      <>
        {floatingBtn}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/50 animate-fade-in"
            onClick={() => setIsOpen(false)}>
            <div className="w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-scale-in"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 bg-white rounded-t-2xl border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Вход для ученика</span>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <StudentLogin onSuccess={name => { setStudentName(name); setAuthState('ok'); studentMe().then(d => setStudentId(d.id || null)).catch(() => {}); }} />
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── Main chat ────────────────────────────────────────────────────────────────
  return (
    <>
      {floatingBtn}
      <div
        className={`chat-app-container fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[370px] sm:max-w-[calc(100vw-24px)] flex flex-col sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ '--chatbot-height': '560px' } as React.CSSProperties}
      >
        <style>{`
          @media (min-width: 640px) {
            .chat-app-container { height: var(--chatbot-height) !important; max-height: calc(100vh - 40px); padding-top: 0; padding-bottom: 0; }
          }
        `}</style>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#1a1a1a', paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
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
            <button onClick={handleReset} className="text-white/50 hover:text-white/80 transition-colors p-1" title="Начать заново">
              <Icon name="RotateCcw" size={14} />
            </button>
          )}
          <button onClick={() => setShowSupport(true)} className="text-white/50 hover:text-white/80 transition-colors p-1" title="Написать в поддержку">
            <Icon name="LifeBuoy" size={14} />
          </button>
          <button onClick={handleLogout} className="text-white/50 hover:text-white/80 transition-colors p-1" title="Выйти">
            <Icon name="LogOut" size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white/80 transition-colors p-1">
            <Icon name="X" size={16} />
          </button>
        </div>

        {showSupport && (
          <SupportModal studentId={studentId} studentName={studentName} onClose={() => setShowSupport(false)} />
        )}

        {/* Mode switcher */}
        {chatTopicsEnabled && chatAiEnabled && (
          <div className="flex gap-1 px-3 py-2 bg-[#111] flex-shrink-0">
            <button
              onClick={() => setMode('topics')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'topics' ? 'bg-white text-[#1a1a1a]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon name="BookOpen" size={12} />
              Темы
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'ai' ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon name="Sparkles" size={12} />
              AI-инструктор
            </button>
          </div>
        )}

        {/* ── Topics mode ── */}
        {mode === 'topics' && chatTopicsEnabled && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll bg-[#f4f6fa] px-3 py-4 flex flex-col gap-3">
              {messages.map(msg => (
                <div key={msg.id}>
                  <MessageBubble message={msg} isNew={newMessageIds.has(msg.id)} studentName={studentName} />
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2.5 animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">И</div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {currentOptions.length > 0 && !isTyping && (
                <OptionButtons options={currentOptions} onSelect={handleOptionSelect} />
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
              <input ref={inputRef} type="text" placeholder="Введите тему или вопрос..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputRef.current?.value.trim()) {
                    handleOptionSelect(inputRef.current.value.trim());
                    inputRef.current.value = '';
                  }
                }}
                className="flex-1 text-sm px-3 py-2 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-[#1a1a1a]/40 transition-colors placeholder:text-gray-400" />
              <button
                onClick={() => { if (inputRef.current?.value.trim()) { handleOptionSelect(inputRef.current.value.trim()); inputRef.current.value = ''; } }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#E8002D' }}>
                <Icon name="Send" size={14} className="text-white" />
              </button>
            </div>
          </>
        )}

        {/* ── AI mode ── */}
        {mode === 'ai' && chatAiEnabled && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll bg-[#f4f6fa] px-3 py-4 flex flex-col gap-3">
              {aiMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'instructor' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {msg.role === 'instructor' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <Icon name="Sparkles" size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'instructor'
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                      : 'bg-[#E8002D] text-white rounded-tr-sm'
                  }`}>
                    {msg.text}
                    {msg.videos?.map((v, i) => (
                      <div key={v.url + i} className={i > 0 ? 'mt-3' : ''}>
                        {v.description && <p className="text-sm leading-relaxed mb-1">{v.description}</p>}
                        <VideoPlayer
                          url={v.url}
                          title={v.title}
                          thumb={v.thumb}
                          studentName={studentName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex gap-2.5 animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Icon name="Sparkles" size={14} className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="flex items-center gap-2 mx-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs animate-fade-in">
                  <Icon name="AlertCircle" size={13} />
                  {aiError}
                </div>
              )}
            </div>

            {/* Быстрые вопросы */}
            {aiMessages.length <= 1 && (
              <div className="px-3 py-2 bg-[#f4f6fa] border-t border-gray-100 flex flex-col gap-1.5 flex-shrink-0">
                <p className="text-xs text-gray-400 font-medium">Быстрые вопросы:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Как правильно парковаться?',
                    'Как сдать экзамен ГИБДД?',
                    'Что такое помеха справа?',
                    'Как вести себя при заносе?',
                  ].map(q => (
                    <button key={q} onClick={() => sendAiMessage(q)}
                      className="px-2.5 py-1 text-xs rounded-full border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voice.supported && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border-t border-purple-100 flex-shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setVoiceMode(v => !v)}
                    className={`w-8 h-[18px] rounded-full relative transition-colors ${voiceMode ? 'bg-purple-500' : 'bg-gray-300'}`}
                  >
                    <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all" style={{ left: voiceMode ? '16px' : '2px' }} />
                  </div>
                  <span className="text-xs font-medium text-purple-700">Голосовой режим</span>
                </label>
              </div>
            )}

            {voiceMode && voice.error && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border-t border-red-100 flex-shrink-0">
                <Icon name="AlertCircle" size={12} className="text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600">{voice.error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}>
              {voiceMode && voice.supported ? (
                <button
                  onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()}
                  disabled={aiLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-xs transition-all disabled:opacity-60 ${
                    voice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500 text-white'
                  }`}
                >
                  <Icon name={voice.isListening ? 'Square' : 'Mic'} size={14} />
                  {voice.isListening ? 'Слушаю...' : 'Нажмите и говорите'}
                </button>
              ) : (
                <>
                  <input ref={aiInputRef} type="text"
                    placeholder="Задайте любой вопрос про вождение..."
                    onKeyDown={handleAiKeyDown}
                    disabled={aiLoading}
                    className="flex-1 text-sm px-3 py-2 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-purple-300 transition-colors placeholder:text-gray-400 disabled:opacity-60" />
                  <button
                    onClick={() => { if (aiInputRef.current?.value.trim()) { sendAiMessage(aiInputRef.current.value.trim()); aiInputRef.current.value = ''; } }}
                    disabled={aiLoading}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-60 transition-opacity"
                    style={{ background: '#7c3aed' }}>
                    <Icon name={aiLoading ? 'Loader' : 'Send'} size={14} className={`text-white ${aiLoading ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}