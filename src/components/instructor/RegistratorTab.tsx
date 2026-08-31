import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { uploadVideo, getArchive, ShiftGroup } from '@/api/instructor';

const ACCEPTED_EXT = ['.mp4', '.mov', '.avi'];

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} ГБ`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  return `${(bytes / 1024).toFixed(0)} КБ`;
}

function fmtShiftDate(iso: string): string {
  const d = new Date(iso);
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface UploadState {
  files: File[];
  currentIndex: number;
  progress: number;
  speedMbps: number;
  done: boolean;
  uploading: boolean;
  error: string;
}

export default function RegistratorTab() {
  const [shiftDate, setShiftDate] = useState(todayIso());
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ files: [], currentIndex: 0, progress: 0, speedMbps: 0, done: false, uploading: false, error: '' });
  const [shifts, setShifts] = useState<ShiftGroup[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const [openShift, setOpenShift] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadArchive = useCallback(() => {
    setLoadingArchive(true);
    getArchive().then(d => setShifts(d.shifts)).catch(() => {}).finally(() => setLoadingArchive(false));
  }, []);

  useEffect(() => { loadArchive(); }, [loadArchive]);

  const isValidFile = (f: File) => ACCEPTED_EXT.some(ext => f.name.toLowerCase().endsWith(ext));

  const startUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(isValidFile);
    if (files.length === 0) return;

    setUpload({ files, currentIndex: 0, progress: 0, speedMbps: 0, done: false, uploading: true, error: '' });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const startTime = Date.now();
      setUpload(prev => ({ ...prev, currentIndex: i, progress: 0 }));

      // Симулируем плавный прогресс во время реальной подготовки/загрузки файла
      let fakeProgress = 0;
      const progressInterval = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + Math.random() * 18, 90);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (file.size * (fakeProgress / 100)) / 1024 / 1024 / elapsed : 0;
        setUpload(prev => ({ ...prev, progress: fakeProgress, speedMbps: speed }));
      }, 200);

      try {
        const base64 = await fileToBase64(file);
        await uploadVideo(shiftDate, file.name, base64);
        clearInterval(progressInterval);
        setUpload(prev => ({ ...prev, progress: 100 }));
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        clearInterval(progressInterval);
        setUpload(prev => ({ ...prev, uploading: false, error: e instanceof Error ? e.message : 'Ошибка загрузки' }));
        return;
      }
    }

    setUpload(prev => ({ ...prev, uploading: false, done: true }));
    loadArchive();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) startUpload(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Область загрузки */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <Icon name="Calendar" size={18} className="text-slate-400" />
            <label className="text-sm text-slate-300 font-semibold">Дата смены</label>
          </div>
          <input
            type="date"
            value={shiftDate}
            onChange={e => setShiftDate(e.target.value)}
            disabled={upload.uploading}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
          />
        </div>

        {!upload.uploading && !upload.done && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center py-12 px-6 ${
              dragOver ? 'border-rose-600 bg-rose-600/5' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-600/10 flex items-center justify-center mb-4">
              <Icon name="UploadCloud" size={26} className="text-rose-500" />
            </div>
            <p className="text-white font-montserrat font-semibold mb-1">Перетащите видео с карты памяти регистратора</p>
            <p className="text-slate-500 text-sm mb-4">или нажмите, чтобы выбрать файлы · .mp4, .mov, .avi</p>
            <span className="text-xs text-slate-600">Фамилии учеников и номера уроков вводить не нужно</span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
              className="hidden"
              onChange={e => e.target.files && startUpload(e.target.files)}
            />
          </div>
        )}

        {upload.uploading && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">
                Загрузка файла {upload.currentIndex + 1} из {upload.files.length}
              </p>
              <span className="text-rose-500 font-bold text-sm">{Math.round(upload.progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden mb-2">
              <div className="h-full bg-rose-600 rounded-full transition-all duration-200" style={{ width: `${upload.progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[60%]">{upload.files[upload.currentIndex]?.name}</span>
              <span>{upload.speedMbps.toFixed(1)} МБ/с</span>
            </div>
          </div>
        )}

        {upload.done && (
          <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-6 flex items-center gap-4">
            <Icon name="CheckCircle2" size={28} className="text-emerald-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Все видео смены успешно сохранены на сервере</p>
              <p className="text-emerald-400/70 text-xs mt-0.5">Загружено файлов: {upload.files.length}</p>
            </div>
            <button
              onClick={() => setUpload({ files: [], currentIndex: 0, progress: 0, speedMbps: 0, done: false, uploading: false, error: '' })}
              className="text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              Загрузить ещё
            </button>
          </div>
        )}

        {upload.error && (
          <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
            <Icon name="AlertCircle" size={15} />{upload.error}
          </div>
        )}
      </div>

      {/* Архив */}
      <div>
        <h3 className="text-white font-montserrat font-bold text-base mb-3 flex items-center gap-2">
          <Icon name="Archive" size={18} className="text-slate-400" />
          Архив выгрузок
        </h3>
        {loadingArchive ? (
          <div className="py-10 text-center text-slate-500">
            <Icon name="Loader" size={22} className="animate-spin mx-auto" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm bg-slate-800 rounded-2xl border border-slate-700">
            Выгрузок пока нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {shifts.map(shift => {
              const isOpen = openShift === shift.shift_date;
              return (
                <div key={shift.shift_date} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setOpenShift(isOpen ? null : shift.shift_date)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="Folder" size={18} className="text-amber-400" />
                      <span className="text-white font-semibold text-sm">
                        {fmtShiftDate(shift.shift_date)} — {shift.files.length} файлов • {fmtBytes(shift.total_size)}
                      </span>
                    </div>
                    <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-500" />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-700 divide-y divide-slate-700/60">
                      {shift.files.map(f => (
                        <div key={f.id} className="flex items-center justify-between px-5 py-3 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon name="FileVideo" size={15} className="text-slate-500 flex-shrink-0" />
                            <span className="text-slate-300 text-sm truncate">{f.file_name}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-slate-500 text-xs">{fmtBytes(f.file_size)}</span>
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <Icon name="Check" size={12} />Загружено
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
