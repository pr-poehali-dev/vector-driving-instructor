import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { mediaUrl, uploadHomeImage, uploadHomeVideo } from '@/api/home';

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadHomeImage(file));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {value ? <img src={mediaUrl(value)} alt="" className="w-full h-full object-cover" /> : <Icon name="Image" size={22} className="text-gray-300" />}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => pick(e.target.files?.[0])} />
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => ref.current?.click()} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60">
              <Icon name={busy ? 'Loader' : 'Upload'} size={13} className={busy ? 'animate-spin' : ''} />
              {busy ? 'Загрузка...' : value ? 'Заменить фото' : 'Загрузить фото'}
            </button>
            {value && !busy && (
              <button type="button" onClick={() => onChange('')}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:text-red-500">
                Убрать
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function VideoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      onChange(await uploadHomeVideo(file, setProgress));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить видео');
    } finally {
      setProgress(null);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {value && (
        <video key={value} src={mediaUrl(value)} controls preload="metadata" className="w-full max-w-sm rounded-xl bg-black mb-2" />
      )}
      <input ref={ref} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={e => pick(e.target.files?.[0])} />
      <div className="flex gap-2 flex-wrap items-center">
        <button type="button" onClick={() => ref.current?.click()} disabled={progress !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60">
          <Icon name={progress !== null ? 'Loader' : 'Upload'} size={13} className={progress !== null ? 'animate-spin' : ''} />
          {progress !== null ? `Загрузка ${progress}%` : value ? 'Заменить видео' : 'Загрузить видео'}
        </button>
        {value && progress === null && (
          <button type="button" onClick={() => onChange('')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:text-red-500">
            Убрать
          </button>
        )}
        <span className="text-xs text-gray-400">MP4, любой размер, звук сохраняется</span>
      </div>
      {progress !== null && (
        <div className="mt-2 h-1.5 w-full max-w-sm rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-[#E8002D] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
