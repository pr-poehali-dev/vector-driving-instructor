import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import {
  DBTopic, DBMessage,
  getAllTopicsAdmin, saveTopic, deleteTopic,
  saveMessage, deleteMessage, reorderTopics, reorderMessages,
} from '@/api/content';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function ytIdFromUrl(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : '';
}

function ytEmbedUrl(raw: string): string {
  if (raw.includes('embed/')) return raw;
  const id = ytIdFromUrl(raw);
  return id ? `https://www.youtube.com/embed/${id}` : raw;
}

function ytThumb(embedUrl: string): string {
  const id = ytIdFromUrl(embedUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

function resolveVideoUrl(raw: string): string {
  if (!raw) return '';
  if (isDirectVideoUrl(raw)) return raw;
  return ytEmbedUrl(raw);
}

function resolveVideoThumb(raw: string): string {
  if (!raw) return '';
  if (isDirectVideoUrl(raw)) return '';
  return ytThumb(ytEmbedUrl(raw));
}

// ─── Message form modal ───────────────────────────────────────────────────────

interface MsgFormProps {
  topicId: number;
  msg?: DBMessage | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (m: DBMessage) => void;
}

function MessageForm({ topicId, msg, nextOrder, onClose, onSaved }: MsgFormProps) {
  const [text, setText] = useState(msg?.text || '');
  const [mediaType, setMediaType] = useState<'none' | 'video' | 'image'>(
    msg?.video_url ? 'video' : msg?.image_url ? 'image' : 'none'
  );
  const [videoRaw, setVideoRaw] = useState(msg?.video_url || '');
  const [videoTitle, setVideoTitle] = useState(msg?.video_title || '');
  const [imageUrl, setImageUrl] = useState(msg?.image_url || '');
  const [imageCaption, setImageCaption] = useState(msg?.image_caption || '');
  const [optionsRaw, setOptionsRaw] = useState((msg?.options || []).join('\n'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const embedUrl = mediaType === 'video' ? resolveVideoUrl(videoRaw) : null;
      const thumb = embedUrl ? resolveVideoThumb(videoRaw) : null;
      const options = optionsRaw.split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
        id: msg?.id,
        topic_id: topicId,
        sort_order: msg?.sort_order ?? nextOrder,
        text,
        video_title: mediaType === 'video' ? videoTitle : null,
        video_url: mediaType === 'video' ? embedUrl : null,
        video_thumb: mediaType === 'video' ? thumb : null,
        image_url: mediaType === 'image' ? imageUrl : null,
        image_caption: mediaType === 'image' ? imageCaption : null,
        options,
      };
      const data = await saveMessage(payload);
      onSaved(data.message);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-montserrat font-bold text-base text-[#1a1a1a]">
            {msg ? 'Редактировать сообщение' : 'Новое сообщение'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={18} /></button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          {/* Text */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Текст сообщения *
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              required
              rows={3}
              placeholder="Введите текст инструктора..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors"
            />
          </div>

          {/* Media type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Медиа (необязательно)
            </label>
            <div className="flex gap-2">
              {(['none', 'video', 'image'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    mediaType === t
                      ? 'border-[#E8002D] bg-red-50 text-[#E8002D]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t === 'none' ? '— Без медиа' : t === 'video' ? '▶ Видео' : '🖼 Картинка'}
                </button>
              ))}
            </div>
          </div>

          {/* Video fields */}
          {mediaType === 'video' && (
            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Ссылка на видео *
                </label>
                <input
                  type="text"
                  value={videoRaw}
                  onChange={e => setVideoRaw(e.target.value)}
                  placeholder="YouTube: https://youtube.com/watch?v=...  или  прямая ссылка .mp4"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  YouTube-ссылка или прямая ссылка на видеофайл (.mp4, .webm и др.)
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Название видео
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Параллельная парковка — полный разбор"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
                />
              </div>
              {videoRaw && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                  {isDirectVideoUrl(videoRaw) ? (
                    <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon name="Video" size={20} className="text-gray-400" />
                    </div>
                  ) : ytIdFromUrl(ytEmbedUrl(videoRaw)) ? (
                    <img
                      src={ytThumb(ytEmbedUrl(videoRaw))}
                      alt="preview"
                      className="w-20 h-14 object-cover rounded-lg"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  ) : null}
                  {(isDirectVideoUrl(videoRaw) || ytIdFromUrl(ytEmbedUrl(videoRaw))) && (
                    <div>
                      <p className="text-xs font-semibold text-green-600">✓ Видео найдено</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isDirectVideoUrl(videoRaw) ? 'Прямая ссылка на файл' : 'Превью загрузится автоматически'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image fields */}
          {mediaType === 'image' && (
            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Ссылка на картинку *
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Скопируйте ссылку на изображение (правой кнопкой → «Копировать адрес изображения»)
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Подпись под картинкой
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={e => setImageCaption(e.target.value)}
                  placeholder="Схема параллельной парковки"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
                />
              </div>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="preview"
                  className="w-full max-h-40 object-contain rounded-xl border border-gray-100"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          )}

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Кнопки-варианты ответа (каждый с новой строки)
            </label>
            <textarea
              value={optionsRaw}
              onChange={e => setOptionsRaw(e.target.value)}
              rows={3}
              placeholder={'Параллельная парковка\nЗаезд в гараж\nРазворот'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Оставьте пустым, если кнопок не нужно</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm">
              <Icon name="AlertCircle" size={14} />{error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : msg ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Topic form modal ─────────────────────────────────────────────────────────

function TopicForm({ topic, onClose, onSaved }: {
  topic?: DBTopic | null;
  onClose: () => void;
  onSaved: (t: DBTopic) => void;
}) {
  const [label, setLabel] = useState(topic?.label || '');
  const [icon, setIcon] = useState(topic?.icon || 'BookOpen');
  const [isActive, setIsActive] = useState(topic?.is_active ?? true);
  const [tags, setTags] = useState(topic?.tags || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ICONS = ['BookOpen', 'ParkingSquare', 'Warehouse', 'RotateCcw', 'GitFork', 'AlertTriangle',
    'Car', 'MapPin', 'Flag', 'Navigation', 'Compass', 'Shield', 'Zap', 'Star'];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await saveTopic({ id: topic?.id, label, icon, is_active: isActive, tags });
      onSaved(data.topic);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-montserrat font-bold text-base">{topic ? 'Редактировать тему' : 'Новая тема'}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Название темы *</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              required
              placeholder="Параллельная парковка"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Теги / синонимы</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="гараж, заезд задним ходом, 90 градусов"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D]"
            />
            <p className="text-xs text-gray-400 mt-1">Через запятую. Бот найдёт тему по любому слову.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  title={ic}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                    icon === ic ? 'border-[#E8002D] bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon name={ic} size={16} className={icon === ic ? 'text-[#E8002D]' : 'text-gray-500'} fallback="BookOpen" />
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full relative transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setIsActive(v => !v)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">{isActive ? 'Тема активна' : 'Тема скрыта'}</span>
          </label>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Отмена</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ background: '#E8002D' }}>
              {loading ? 'Сохранение...' : topic ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Message card ─────────────────────────────────────────────────────────────

function MessageCard({ msg, index, total, onEdit, onDelete, onMove }: {
  msg: DBMessage;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const hasVideo = !!msg.video_url;
  const hasImage = !!msg.image_url;
  const hasOptions = msg.options && msg.options.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3 group hover:shadow-sm transition-shadow">
      {/* Order arrows */}
      <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all"
        >
          <Icon name="ChevronUp" size={13} />
        </button>
        <span className="text-xs text-gray-300 text-center w-6">{index + 1}</span>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all"
        >
          <Icon name="ChevronDown" size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {hasVideo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
              <Icon name="Play" size={10} />
              {msg.video_title || 'Видео'}
            </span>
          )}
          {hasImage && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs">
              <Icon name="Image" size={10} />
              Картинка
            </span>
          )}
          {hasOptions && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs">
              <Icon name="List" size={10} />
              {msg.options.length} кнопки
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-all">
          <Icon name="Pencil" size={13} />
        </button>
        <button onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <Icon name="Trash2" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ContentEditor ───────────────────────────────────────────────────────

export default function ContentEditor() {
  const [topics, setTopics] = useState<DBTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<DBTopic | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editTopic, setEditTopic] = useState<DBTopic | null>(null);
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [editMsg, setEditMsg] = useState<DBMessage | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllTopicsAdmin();
      setTopics(data.topics);
      if (activeTopic) {
        const updated = data.topics.find((t: DBTopic) => t.id === activeTopic.id);
        setActiveTopic(updated || data.topics[0] || null);
      } else {
        setActiveTopic(data.topics[0] || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteTopic = async (t: DBTopic) => {
    if (!confirm(`Скрыть тему «${t.label}»?`)) return;
    await deleteTopic(t.id);
    load();
  };

  const handleDeleteMsg = async (msg: DBMessage) => {
    if (!confirm('Удалить это сообщение?')) return;
    await deleteMessage(msg.id);
    load();
  };

  const handleMoveMsg = async (msgs: DBMessage[], index: number, dir: -1 | 1) => {
    const newMsgs = [...msgs];
    const tmp = newMsgs[index];
    newMsgs[index] = newMsgs[index + dir];
    newMsgs[index + dir] = tmp;
    const order = newMsgs.map((m, i) => ({ id: m.id, sort_order: i + 1 }));
    await reorderMessages(order);
    load();
  };

  const handleMoveTopic = async (index: number, dir: -1 | 1) => {
    const arr = [...topics];
    const tmp = arr[index];
    arr[index] = arr[index + dir];
    arr[index + dir] = tmp;
    const order = arr.map((t, i) => ({ id: t.id, sort_order: i + 1 }));
    await reorderTopics(order);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader" size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat font-bold text-xl text-[#1a1a1a]">Контент чат-бота</h2>
          <p className="text-sm text-gray-400 mt-0.5">Темы, видеоуроки и сообщения инструктора</p>
        </div>
        <button
          onClick={() => { setEditTopic(null); setShowTopicForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: '#E8002D' }}
        >
          <Icon name="Plus" size={15} />
          Новая тема
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Topics sidebar */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">Темы ({topics.length})</p>
          {topics.map((t, i) => (
            <div
              key={t.id}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border transition-all ${
                activeTopic?.id === t.id
                  ? 'border-[#E8002D] bg-red-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              onClick={() => setActiveTopic(t)}
            >
              {/* move arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); handleMoveTopic(i, -1); }}
                  disabled={i === 0}
                  className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <Icon name="ChevronUp" size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); handleMoveTopic(i, 1); }}
                  disabled={i === topics.length - 1}
                  className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <Icon name="ChevronDown" size={11} />
                </button>
              </div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activeTopic?.id === t.id ? 'bg-[#E8002D]' : 'bg-gray-100'
              }`}>
                <Icon name={t.icon} size={15}
                  className={activeTopic?.id === t.id ? 'text-white' : 'text-gray-500'}
                  fallback="BookOpen" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeTopic?.id === t.id ? 'text-[#E8002D]' : 'text-gray-700'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-gray-400">{t.messages.length} сообщ.</p>
              </div>

              {!t.is_active && (
                <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md flex-shrink-0">скрыта</span>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditTopic(t); setShowTopicForm(true); }}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white">
                  <Icon name="Pencil" size={12} />
                </button>
                <button onClick={() => handleDeleteTopic(t)}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white">
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            </div>
          ))}

          {topics.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Тем пока нет.<br />Создайте первую тему →
            </div>
          )}
        </div>

        {/* Messages panel */}
        <div className="md:col-span-2">
          {activeTopic ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-montserrat font-bold text-base text-[#1a1a1a]">{activeTopic.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activeTopic.messages.length} сообщений</p>
                </div>
                <button
                  onClick={() => { setEditMsg(null); setShowMsgForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8002D] text-[#E8002D] text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  <Icon name="Plus" size={14} />
                  Добавить
                </button>
              </div>

              {activeTopic.messages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400 text-sm">
                  <Icon name="MessageSquare" size={28} className="mx-auto mb-3 opacity-30" />
                  Сообщений пока нет.<br />Нажмите «Добавить» чтобы создать первое.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeTopic.messages.map((msg, i) => (
                    <MessageCard
                      key={msg.id}
                      msg={msg}
                      index={i}
                      total={activeTopic.messages.length}
                      onEdit={() => { setEditMsg(msg); setShowMsgForm(true); }}
                      onDelete={() => handleDeleteMsg(msg)}
                      onMove={dir => handleMoveMsg(activeTopic.messages, i, dir)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm bg-gray-50 rounded-2xl">
              <Icon name="MousePointerClick" size={28} className="mb-3 opacity-30" />
              Выберите тему слева
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTopicForm && (
        <TopicForm
          topic={editTopic}
          onClose={() => { setShowTopicForm(false); setEditTopic(null); }}
          onSaved={() => load()}
        />
      )}
      {showMsgForm && activeTopic && (
        <MessageForm
          topicId={activeTopic.id}
          msg={editMsg}
          nextOrder={(activeTopic.messages.length || 0) + 1}
          onClose={() => { setShowMsgForm(false); setEditMsg(null); }}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}