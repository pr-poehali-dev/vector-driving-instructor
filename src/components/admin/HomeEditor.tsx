import { useEffect, useState, type ReactNode } from 'react';
import Icon from '@/components/ui/icon';
import {
  getHomeAdmin, saveHomeItem, deleteHomeItem, reorderHomeItems, saveHomeSetting,
  type HomeAdminContent, type Section, type DemoSettings,
} from '@/api/home';
import { ImageField, VideoField } from '@/components/admin/home/MediaFields';

type Data = Record<string, unknown>;

const SECTION_TITLES: { key: Section | 'demo' | 'map'; label: string; icon: string }[] = [
  { key: 'fleet', label: 'Автопарк', icon: 'Car' },
  { key: 'masters', label: 'Мастера', icon: 'Users' },
  { key: 'videos', label: 'Школа в кадре', icon: 'Video' },
  { key: 'demo', label: 'Демо-доступ', icon: 'PlayCircle' },
  { key: 'faq', label: 'Вопросы', icon: 'MessageCircleQuestion' },
  { key: 'locations', label: 'Филиалы', icon: 'MapPin' },
  { key: 'map', label: 'Карта 2ГИС', icon: 'Map' },
];

const NEW_ITEM: Record<Section, Data> = {
  fleet: { group: '', title: '', subtitle: '', image_url: '', wide: false },
  masters: { name: '', role: '', years: '', quote: '', tags: [], photo_url: '', featured: false },
  videos: { title: '', caption: '', video_url: '', poster_url: '', format: 'wide' },
  faq: { question: '', answer: '' },
  locations: { name: '', address: '', kind: 'офис', hours: 'Пн–Вс 08:30–20:30', phone: '8 (919) 591-55-58', lat: 55.44, lng: 65.33 },
};

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors bg-white';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

function Text({ label, value, onChange, area, placeholder }: { label: string; value: unknown; onChange: (v: string) => void; area?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {area
        ? <textarea rows={3} value={String(value ?? '')} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={inputCls} />
        : <input value={String(value ?? '')} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={inputCls} />}
    </div>
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-[#E8002D]" />
      {label}
    </label>
  );
}

function ItemForm({ section, data, set }: { section: Section; data: Data; set: (k: string, v: unknown) => void }) {
  if (section === 'fleet') return (
    <div className="flex flex-col gap-3">
      <ImageField label="Фото" value={String(data.image_url || '')} onChange={v => set('image_url', v)} />
      <Text label="Название" value={data.title} onChange={v => set('title', v)} placeholder="Tesla Model X" />
      <Text label="Подпись" value={data.subtitle} onChange={v => set('subtitle', v)} placeholder="Занятие на ней входит в каждый тариф" />
      <Text label="Группа (для вкладок над фото)" value={data.group} onChange={v => set('group', v)} placeholder="Tesla" />
      <Check label="Широкая карточка" value={!!data.wide} onChange={v => set('wide', v)} />
    </div>
  );
  if (section === 'masters') return (
    <div className="flex flex-col gap-3">
      <ImageField label="Фото мастера" value={String(data.photo_url || '')} onChange={v => set('photo_url', v)} />
      <Text label="Имя и фамилия" value={data.name} onChange={v => set('name', v)} />
      <Text label="Должность" value={data.role} onChange={v => set('role', v)} placeholder="мастер · категория B" />
      <Text label="Стаж" value={data.years} onChange={v => set('years', v)} placeholder="14 лет" />
      <Text label="Цитата или описание" value={data.quote} onChange={v => set('quote', v)} area />
      <Text label="Теги через запятую" value={((data.tags as string[]) || []).join(', ')}
        onChange={v => set('tags', v.split(',').map(t => t.trim()).filter(Boolean))} placeholder="Город, Перекрёстки" />
      <Check label="Большая карточка с фото на всю высоту" value={!!data.featured} onChange={v => set('featured', v)} />
    </div>
  );
  if (section === 'videos') return (
    <div className="flex flex-col gap-3">
      <VideoField label="Видео" value={String(data.video_url || '')} onChange={v => set('video_url', v)} />
      <ImageField label="Обложка до запуска (необязательно)" value={String(data.poster_url || '')} onChange={v => set('poster_url', v)} />
      <Text label="Заголовок" value={data.title} onChange={v => set('title', v)} />
      <Text label="Подпись" value={data.caption} onChange={v => set('caption', v)} />
      <div>
        <label className={labelCls}>Формат</label>
        <select value={String(data.format || 'wide')} onChange={e => set('format', e.target.value)} className={inputCls}>
          <option value="wide">Горизонтальное (широкое)</option>
          <option value="vertical">Вертикальное (как в телефоне)</option>
        </select>
      </div>
    </div>
  );
  if (section === 'faq') return (
    <div className="flex flex-col gap-3">
      <Text label="Вопрос" value={data.question} onChange={v => set('question', v)} />
      <Text label="Ответ" value={data.answer} onChange={v => set('answer', v)} area />
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      <Text label="Название" value={data.name} onChange={v => set('name', v)} placeholder="Станционная" />
      <Text label="Адрес" value={data.address} onChange={v => set('address', v)} placeholder="ул. Станционная, 49" />
      <div className="grid grid-cols-2 gap-3">
        <Text label="Тип" value={data.kind} onChange={v => set('kind', v)} placeholder="офис или площадка" />
        <Text label="Телефон" value={data.phone} onChange={v => set('phone', v)} />
      </div>
      <Text label="Режим работы" value={data.hours} onChange={v => set('hours', v)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Широта</label>
          <input type="number" step="any" value={Number(data.lat ?? 0)} onChange={e => set('lat', parseFloat(e.target.value) || 0)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Долгота</label>
          <input type="number" step="any" value={Number(data.lng ?? 0)} onChange={e => set('lng', parseFloat(e.target.value) || 0)} className={inputCls} />
        </div>
      </div>
      <p className="text-xs text-gray-400">Координаты точки на карте. Их можно скопировать из 2ГИС: правая кнопка по месту на карте.</p>
    </div>
  );
}

function itemTitle(section: Section, d: Data): string {
  const s = (k: string) => String(d[k] || '').trim();
  if (section === 'faq') return s('question') || 'Новый вопрос';
  if (section === 'masters') return s('name') || 'Новый мастер';
  if (section === 'locations') return s('name') ? `${s('name')} — ${s('address')}` : 'Новый адрес';
  return s('title') || (section === 'fleet' ? 'Новое фото' : 'Новое видео');
}

function itemThumb(section: Section, d: Data): string {
  if (section === 'fleet') return String(d.image_url || '');
  if (section === 'masters') return String(d.photo_url || '');
  if (section === 'videos') return String(d.poster_url || '');
  return '';
}

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-montserrat font-bold text-base">{title}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">{footer}</div>
      </div>
    </div>
  );
}

function SectionList({ section, content, reload }: { section: Section; content: HomeAdminContent; reload: () => Promise<void> }) {
  const list = content.items[section] as { id: number; is_active: boolean; data: Data }[];
  const [editing, setEditing] = useState<{ id?: number; data: Data } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await saveHomeItem(section, editing.data, editing.id);
      await reload();
      setEditing(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Удалить эту запись с сайта?')) return;
    await deleteHomeItem(id);
    await reload();
  };

  const toggle = async (it: { id: number; is_active: boolean; data: Data }) => {
    await saveHomeItem(section, it.data, it.id, !it.is_active);
    await reload();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const ids = list.map(i => i.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await reorderHomeItems(ids);
    await reload();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button onClick={() => { setError(''); setEditing({ data: { ...NEW_ITEM[section] } }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: '#E8002D' }}>
          <Icon name="Plus" size={15} />Добавить
        </button>
      </div>

      {list.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-sm text-gray-400">
          Пока пусто. Если раздел оставить пустым, на сайте останется прежний вариант.
        </div>
      )}

      {list.map((it, idx) => {
        const thumb = itemThumb(section, it.data);
        return (
          <div key={it.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 ${it.is_active ? '' : 'opacity-50'}`}>
            {(section === 'fleet' || section === 'masters' || section === 'videos') && (
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <Icon name={section === 'videos' ? 'Video' : 'Image'} size={18} className="text-gray-300" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a] truncate">{itemTitle(section, it.data)}</p>
              {section === 'masters' && <p className="text-xs text-gray-400 truncate">{String(it.data.role || '')}</p>}
              {section === 'fleet' && <p className="text-xs text-gray-400 truncate">{String(it.data.group || '')}</p>}
              {section === 'videos' && <p className="text-xs text-gray-400 truncate">{it.data.video_url ? 'Видео загружено' : 'Видео не загружено'}</p>}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Выше" className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-25"><Icon name="ChevronUp" size={16} /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === list.length - 1} title="Ниже" className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-25"><Icon name="ChevronDown" size={16} /></button>
              <button onClick={() => toggle(it)} title={it.is_active ? 'Скрыть с сайта' : 'Показать на сайте'} className="p-1.5 text-gray-400 hover:text-gray-700"><Icon name={it.is_active ? 'Eye' : 'EyeOff'} size={16} /></button>
              <button onClick={() => { setError(''); setEditing({ id: it.id, data: { ...it.data } }); }} title="Изменить" className="p-1.5 text-gray-400 hover:text-[#E8002D]"><Icon name="Pencil" size={16} /></button>
              <button onClick={() => remove(it.id)} title="Удалить" className="p-1.5 text-gray-300 hover:text-red-500"><Icon name="Trash2" size={16} /></button>
            </div>
          </div>
        );
      })}

      {editing && (
        <Modal
          title={editing.id ? 'Изменить' : 'Добавить'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Отмена</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </>
          }
        >
          <ItemForm section={section} data={editing.data} set={(k, v) => setEditing(e => (e ? { ...e, data: { ...e.data, [k]: v } } : e))} />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{error}</p>}
        </Modal>
      )}
    </div>
  );
}

function DemoForm({ content, reload }: { content: HomeAdminContent; reload: () => Promise<void> }) {
  const init: DemoSettings = content.settings.demo || {
    video_url: '', video_title: '', video_caption: '', q_label: '', q_tag: 'ПДД РФ', question: '', answers: ['', '', ''],
  };
  const [d, setD] = useState<DemoSettings>(init);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    setDone(false);
    try {
      await saveHomeSetting('demo', { ...d, answers: d.answers.filter(a => a.trim()) });
      await reload();
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  const setAnswer = (i: number, v: string) => setD(x => ({ ...x, answers: x.answers.map((a, k) => (k === i ? v : a)) }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <VideoField label="Видеоурок для демо (на сайте идёт без звука, по кругу)" value={d.video_url} onChange={v => setD(x => ({ ...x, video_url: v }))} />
      <Text label="Заголовок видео" value={d.video_title} onChange={v => setD(x => ({ ...x, video_title: v }))} />
      <Text label="Подпись видео" value={d.video_caption} onChange={v => setD(x => ({ ...x, video_caption: v }))} area />
      <div className="grid grid-cols-2 gap-3">
        <Text label="Название билета" value={d.q_label} onChange={v => setD(x => ({ ...x, q_label: v }))} placeholder="Билет 1 · вопрос 7" />
        <Text label="Метка" value={d.q_tag} onChange={v => setD(x => ({ ...x, q_tag: v }))} />
      </div>
      <Text label="Вопрос по ПДД" value={d.question} onChange={v => setD(x => ({ ...x, question: v }))} area />
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Варианты ответа</label>
        {d.answers.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input value={a} onChange={e => setAnswer(i, e.target.value)} placeholder={`Вариант ${i + 1}`} className={inputCls} />
            <button onClick={() => setD(x => ({ ...x, answers: x.answers.filter((_, k) => k !== i) }))} className="p-2 text-gray-300 hover:text-red-500"><Icon name="Trash2" size={16} /></button>
          </div>
        ))}
        {d.answers.length < 6 && (
          <button onClick={() => setD(x => ({ ...x, answers: [...x.answers, ''] }))} className="self-start text-sm font-semibold text-[#E8002D]">+ Добавить вариант</button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {done && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} />Сохранено</span>}
      </div>
    </div>
  );
}

function MapForm({ content, reload }: { content: HomeAdminContent; reload: () => Promise<void> }) {
  const [key, setKey] = useState(content.settings.map?.key || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    setDone(false);
    try {
      await saveHomeSetting('map', { key: key.trim() });
      await reload();
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="text-sm text-gray-600 leading-relaxed">
        Пока ключа нет, на сайте показывается карта OpenStreetMap с теми же точками. Чтобы включить карту 2ГИС:
        <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1">
          <li>Откройте platform.2gis.ru и войдите или зарегистрируйтесь.</li>
          <li>Создайте проект и добавьте ключ для «Карт MapGL».</li>
          <li>Вставьте ключ ниже и нажмите «Сохранить».</li>
        </ol>
      </div>
      <Text label="Ключ 2ГИС" value={key} onChange={setKey} placeholder="Вставьте ключ" />
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#E8002D' }}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {done && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} />Сохранено</span>}
      </div>
    </div>
  );
}

export default function HomeEditor() {
  const [content, setContent] = useState<HomeAdminContent | null>(null);
  const [active, setActive] = useState<Section | 'demo' | 'map'>('fleet');
  const [error, setError] = useState('');

  const reload = async () => {
    try {
      setContent(await getHomeAdmin());
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    }
  };

  useEffect(() => { reload(); }, []);

  if (error) return <div className="py-12 text-center text-sm text-red-500">{error}</div>;
  if (!content) return <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Главная страница сайта</h2>
        <p className="text-sm text-gray-400 mt-0.5">Всё, что вы измените здесь, сразу появится на сайте.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SECTION_TITLES.map(s => (
          <button key={s.key} onClick={() => setActive(s.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              active === s.key ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:text-gray-800'
            }`}>
            <Icon name={s.icon} size={14} fallback="Settings" />{s.label}
          </button>
        ))}
      </div>
      {active === 'demo' && <DemoForm key={JSON.stringify(content.settings.demo)} content={content} reload={reload} />}
      {active === 'map' && <MapForm key={content.settings.map?.key || 'none'} content={content} reload={reload} />}
      {active !== 'demo' && active !== 'map' && <SectionList key={active} section={active} content={content} reload={reload} />}
    </div>
  );
}
