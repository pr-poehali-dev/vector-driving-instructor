import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { ChatMessage } from '@/data/chatData';
import StudentLogin from '@/components/StudentLogin';
import { studentMe, studentLogout } from '@/api/auth';
import { getTopics, DBTopic } from '@/api/content';

const AI_URL = 'https://functions.poehali.dev/75e85bcd-a1d8-49cf-9700-e0da694a7ed8';

interface VideoPlayerProps { url: string; title: string; thumb: string; studentName?: string }

function VideoPlayer({ url, title, thumb, studentName }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const watermark = studentName || '';
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

  const Watermarks = watermark ? (
    <>
      <div className="absolute inset-0 pointer-events-none z-10 flex items-end justify-end p-3" style={{ userSelect: 'none' }}>
        <span className="text-white/30 text-xs font-medium select-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>{watermark}</span>
      </div>
      <div className="absolute top-3 left-3 pointer-events-none z-10" style={{ userSelect: 'none' }}>
        <span className="text-white/20 text-xs font-medium select-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>{watermark}</span>
      </div>
    </>
  ) : null;

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-white/20" onContextMenu={e => e.preventDefault()}>
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
        <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }} onContextMenu={e => e.preventDefault()}>
          {isDirectVideo ? (
            <video
              className="w-full h-full"
              autoPlay
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              playsInline
            >
              <source src={url} />
            </video>
          ) : (
            <iframe
              src={`${url}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
              allowFullScreen
            />
          )}
          {Watermarks}
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
            <div className="mt-2 rounded-lg overflow-hidden">
              <img src={message.image.src} alt={message.image.caption} className="w-full" />
              <p className="text-xs text-gray-500 mt-1 italic">{message.image.caption}</p>
            </div>
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
    video: m.video_url ? { title: m.video_title || '', url: m.video_url, thumb: m.video_thumb || '' } : undefined,
    image: m.image_url ? { src: m.image_url, caption: m.image_caption || '' } : undefined,
    options: m.options?.length ? m.options : undefined,
  }));
}

type ChatMode = 'topics' | 'ai';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [dbTopics, setDbTopics] = useState<DBTopic[]>([]);
  const [mode, setMode] = useState<ChatMode>('topics');

  // topics mode state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // ai mode state
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'instructor'; text: string; id: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

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

  // Инициализируем AI-режим приветствием
  useEffect(() => {
    if (mode === 'ai' && aiMessages.length === 0) {
      setAiMessages([{
        id: 'ai-welcome',
        role: 'instructor',
        text: `Привет${studentName ? ', ' + studentName : ''}! 👋 Я ваш AI-инструктор. Задайте любой вопрос про вождение, ПДД или подготовку к экзамену — отвечу подробно!`,
      }]);
    }
  }, [mode]);

  useEffect(() => {
    studentMe()
      .then(d => { setStudentName(d.name); setAuthState('ok'); })
      .catch(() => setAuthState('login'));
  }, []);

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

    const topic = dbTopics.find(t => t.label === option);
    if (topic) {
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

    // Собираем историю (без приветствия)
    const history = aiMessages
      .filter(m => m.id !== 'ai-welcome')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'instructor', text: m.text }));

    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setAiMessages(prev => [...prev, {
        id: `ai-resp-${Date.now()}`, role: 'instructor', text: data.answer,
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
              <StudentLogin onSuccess={name => { setStudentName(name); setAuthState('ok'); }} />
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
        className={`fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ height: '560px', maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Header */}
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
            <button onClick={handleReset} className="text-white/50 hover:text-white/80 transition-colors p-1" title="Начать заново">
              <Icon name="RotateCcw" size={14} />
            </button>
          )}
          <button onClick={handleLogout} className="text-white/50 hover:text-white/80 transition-colors p-1" title="Выйти">
            <Icon name="LogOut" size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white/80 transition-colors p-1">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Mode switcher */}
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

        {/* ── Topics mode ── */}
        {mode === 'topics' && (
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
        {mode === 'ai' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll bg-[#f4f6fa] px-3 py-4 flex flex-col gap-3">
              {aiMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'instructor' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {msg.role === 'instructor' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="Sparkles" size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'instructor'
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                      : 'bg-[#E8002D] text-white rounded-tr-sm'
                  }`}>
                    {msg.text}
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

            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
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
            </div>
          </>
        )}
      </div>
    </>
  );
}