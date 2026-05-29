import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { WELCOME_MESSAGE, TOPICS, TOPIC_MAP, ChatMessage } from '@/data/chatData';
import StudentLogin from '@/components/StudentLogin';
import { studentMe, studentLogout } from '@/api/auth';

interface VideoPlayerProps {
  url: string;
  title: string;
  thumb: string;
}

function VideoPlayer({ url, title, thumb }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
      {!playing ? (
        <div
          className="relative cursor-pointer group"
          onClick={() => setPlaying(true)}
        >
          <img src={thumb} alt={title} className="w-full h-36 object-cover" />
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
        <iframe
          src={`${url}?autoplay=1`}
          title={title}
          className="w-full h-48"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}

function MessageBubble({ message, isNew }: { message: ChatMessage; isNew?: boolean }) {
  const isInstructor = message.role === 'instructor';

  return (
    <div
      className={`flex gap-2.5 ${isInstructor ? 'flex-row' : 'flex-row-reverse'} ${isNew ? 'animate-fade-in' : ''}`}
    >
      {isInstructor && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold shadow-sm">
          И
        </div>
      )}
      <div className={`max-w-[85%] ${isInstructor ? '' : 'items-end'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isInstructor
              ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
              : 'bg-[#E8002D] text-white rounded-tr-sm'
          }`}
        >
          {message.text}
          {message.image && (
            <div className="mt-2 rounded-lg overflow-hidden">
              <img src={message.image.src} alt={message.image.caption} className="w-full" />
              <p className="text-xs text-gray-500 mt-1 italic">{message.image.caption}</p>
            </div>
          )}
          {message.video && (
            <VideoPlayer
              url={message.video.url}
              title={message.video.title}
              thumb={message.video.thumb}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OptionButtons({ options, onSelect }: { options: string[]; onSelect: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 pl-10 animate-fade-in">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 text-xs rounded-full border border-[#1a1a1a]/30 text-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200 font-medium"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [currentOptions, setCurrentOptions] = useState<string[]>(WELCOME_MESSAGE.options || []);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Проверяем сессию при монтировании
  useEffect(() => {
    studentMe()
      .then(d => { setStudentName(d.name); setAuthState('ok'); })
      .catch(() => setAuthState('login'));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleLogout = () => {
    studentLogout();
    setAuthState('login');
    setIsOpen(false);
  };

  const handleOptionSelect = (option: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: option,
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentOptions([]);
    setIsTyping(true);
    setNewMessageIds((prev) => new Set([...prev, userMsg.id]));

    const topicId = TOPIC_MAP[option];
    const topic = TOPICS.find((t) => t.id === topicId);

    if (topic) {
      let delay = 800;
      topic.messages.forEach((msg, i) => {
        setTimeout(() => {
          setIsTyping(i < topic.messages.length - 1);
          setMessages((prev) => [...prev, msg]);
          setNewMessageIds((prev) => new Set([...prev, msg.id]));
          if (i === topic.messages.length - 1) {
            setCurrentOptions(msg.options || []);
          }
        }, delay);
        delay += msg.video ? 1800 : msg.image ? 1400 : 1000;
      });
    } else {
      setTimeout(() => {
        const fallback: ChatMessage = {
          id: `fallback-${Date.now()}`,
          role: 'instructor',
          text: 'Выберите тему из предложенных вариантов — расскажу подробно.',
          options: ['Параллельная парковка', 'Заезд в гараж', 'Разворот в ограниченном пространстве', 'Правила проезда перекрёстков', 'Экстренное торможение'],
        };
        setMessages((prev) => [...prev, fallback]);
        setCurrentOptions(fallback.options || []);
        setIsTyping(false);
        setNewMessageIds((prev) => new Set([...prev, fallback.id]));
      }, 900);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputRef.current?.value.trim()) {
      const val = inputRef.current.value.trim();
      inputRef.current.value = '';
      handleOptionSelect(val);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentOptions(WELCOME_MESSAGE.options || []);
    setIsTyping(false);
    setNewMessageIds(new Set(['welcome']));
  };

  // Кнопка-триггер (всегда видна, открывает чат или форму входа)
  const floatingBtn = (
    <button
      data-chatbot-btn
      onClick={() => setIsOpen(true)}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 pulse-red ${
        isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
      }`}
      style={{ background: '#E8002D' }}
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Icon name="MessageCircle" size={16} className="text-white" />
      </div>
      <span className="text-white font-semibold text-sm font-montserrat pr-1">Спросить инструктора</span>
    </button>
  );

  // Ещё проверяем авторизацию
  if (authState === 'checking') {
    return floatingBtn;
  }

  // Форма входа (overlay поверх страницы)
  if (authState === 'login') {
    return (
      <>
        {floatingBtn}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/50 animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Close bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-white rounded-t-2xl border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Вход для ученика</span>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <StudentLogin
                onSuccess={(name) => {
                  setStudentName(name);
                  setAuthState('ok');
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Основной чат (авторизован)
  return (
    <>
      {floatingBtn}

      {/* Chat window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ height: '540px', maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#1a1a1a' }}>
          <div className="w-9 h-9 rounded-full bg-[#E8002D] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
            И
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm font-montserrat">Инструктор Вектор</p>
            <p className="text-white/60 text-xs truncate">
              {studentName ? `Привет, ${studentName}` : 'Автошкола • Онлайн'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-white/50 hover:text-white/80 transition-colors p-1"
            title="Начать заново"
          >
            <Icon name="RotateCcw" size={14} />
          </button>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white/80 transition-colors p-1"
            title="Выйти"
          >
            <Icon name="LogOut" size={14} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/50 hover:text-white/80 transition-colors p-1"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto chat-scroll bg-[#f4f6fa] px-3 py-4 flex flex-col gap-3"
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <MessageBubble message={msg} isNew={newMessageIds.has(msg.id)} />
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">
                И
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {currentOptions.length > 0 && !isTyping && (
            <OptionButtons options={currentOptions} onSelect={handleOptionSelect} />
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100">
          <input
            ref={inputRef}
            type="text"
            placeholder="Задайте вопрос инструктору..."
            onKeyDown={handleInputKeyDown}
            className="flex-1 text-sm px-3 py-2 rounded-full bg-[#f4f6fa] border border-gray-200 outline-none focus:border-[#1a1a1a]/40 transition-colors placeholder:text-gray-400"
          />
          <button
            onClick={() => {
              if (inputRef.current?.value.trim()) {
                handleOptionSelect(inputRef.current.value.trim());
                inputRef.current.value = '';
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: '#E8002D' }}
          >
            <Icon name="Send" size={14} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
}