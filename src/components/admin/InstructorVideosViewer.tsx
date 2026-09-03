import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getInstructorVideos, getInstructorVideoUrl, InstructorVideos, VideoFile } from '@/api/instructorsAdmin';

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

function VideoPlayerModal({ file, onClose }: { file: VideoFile; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInstructorVideoUrl(file.id)
      .then(d => setUrl(d.url))
      .catch(e => setError(e instanceof Error ? e.message : 'Не удалось получить ссылку'))
      .finally(() => setLoading(false));
  }, [file.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-medium truncate">{file.file_name}</span>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 flex-shrink-0">
            <Icon name="X" size={22} />
          </button>
        </div>
        <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center min-h-[240px]">
          {loading ? (
            <Icon name="Loader" size={28} className="animate-spin text-white/50 my-16" />
          ) : error ? (
            <p className="text-red-400 text-sm py-16">{error}</p>
          ) : (
            <video src={url} controls autoPlay className="w-full max-h-[70vh]" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InstructorVideosViewer() {
  const [instructors, setInstructors] = useState<InstructorVideos[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInstructor, setOpenInstructor] = useState<number | null>(null);
  const [openShift, setOpenShift] = useState<string | null>(null);
  const [playFile, setPlayFile] = useState<VideoFile | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getInstructorVideos().then(d => setInstructors(d.instructors)).finally(() => setLoading(false));
  }, []);

  const filtered = instructors.filter(i => i.instructor_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="py-16 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto mb-3" />Загрузка...</div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat font-bold text-lg text-[#1a1a1a]">Видеорегистратор</h2>
          <p className="text-sm text-gray-400 mt-0.5">Записи со всех учебных автомобилей — просмотр без скачивания</p>
        </div>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск мастера..."
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Icon name="Video" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">{instructors.length === 0 ? 'Видео пока никто не загружал' : 'Ничего не найдено'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(instr => {
            const totalFiles = instr.shifts.reduce((s, sh) => s + sh.files.length, 0);
            const totalSize = instr.shifts.reduce((s, sh) => s + sh.total_size, 0);
            const isOpen = openInstructor === instr.instructor_id;
            return (
              <div key={instr.instructor_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenInstructor(isOpen ? null : instr.instructor_id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {instr.instructor_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#1a1a1a]">{instr.instructor_name}</p>
                      <p className="text-xs text-gray-400">{instr.shifts.length} смен · {totalFiles} файлов · {fmtBytes(totalSize)}</p>
                    </div>
                  </div>
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-gray-400" />
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-3 flex flex-col gap-2">
                    {instr.shifts.map(shift => {
                      const shiftKey = `${instr.instructor_id}-${shift.shift_date}`;
                      const shiftOpen = openShift === shiftKey;
                      return (
                        <div key={shiftKey} className="bg-gray-50 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenShift(shiftOpen ? null : shiftKey)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                          >
                            <span className="text-sm text-gray-700 flex items-center gap-2">
                              <Icon name="Folder" size={14} className="text-amber-400" />
                              {fmtShiftDate(shift.shift_date)} — {shift.files.length} файлов • {fmtBytes(shift.total_size)}
                            </span>
                            <Icon name={shiftOpen ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                          </button>
                          {shiftOpen && (
                            <div className="divide-y divide-gray-200/60">
                              {shift.files.map(f => (
                                <div key={f.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon name="FileVideo" size={14} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">{f.file_name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs text-gray-400">{fmtBytes(f.file_size)}</span>
                                    <button
                                      onClick={() => setPlayFile(f)}
                                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity"
                                    >
                                      <Icon name="Play" size={11} />Смотреть
                                    </button>
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
            );
          })}
        </div>
      )}

      {playFile && <VideoPlayerModal file={playFile} onClose={() => setPlayFile(null)} />}
    </div>
  );
}
