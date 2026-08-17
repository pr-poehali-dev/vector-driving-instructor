import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import Icon from '@/components/ui/icon';
import { RoutePoint } from '@/api/route';

const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];

function getYtId(u: string): string | null {
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function getRtId(u: string): string | null {
  const m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export interface RouteVideoHandle {
  seekTo: (seconds: number) => void;
}

interface Props {
  url: string;
  points: RoutePoint[];
  onActivePointChange: (point: RoutePoint | null, progressRatio: number) => void;
  activePoint?: RoutePoint | null;
}

// Прямой mp4/webm видеофайл — единственный формат, который поддерживает точную
// программную перемотку и определение текущего времени для синхронизации с картой.
const RouteVideoPlayer = forwardRef<RouteVideoHandle, Props>(({ url, points, onActivePointChange, activePoint }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const ytId = getYtId(url);
  const rtId = getRtId(url);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      const v = videoRef.current;
      if (v) { v.currentTime = seconds; if (!playing) v.play().catch(() => {}); }
    },
  }));

  const sortedPoints = [...points].sort((a, b) => a.video_timestamp_sec - b.video_timestamp_sec);

  const findActivePoint = useCallback((t: number) => {
    let active: RoutePoint | null = null;
    for (const p of sortedPoints) {
      if (p.video_timestamp_sec <= t) active = p;
      else break;
    }
    return active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isDirectVideo) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      const active = findActivePoint(v.currentTime);
      onActivePointChange(active, duration ? v.currentTime / duration : 0);
    };
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', () => setPlaying(true));
    v.addEventListener('pause', () => setPlaying(false));
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [isDirectVideo, findActivePoint, onActivePointChange, duration]);

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const seek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current.requestFullscreen();
  };

  if (!isDirectVideo) {
    // YouTube/Rutube embed — без покадровой синхронизации (iframe API не всегда доступен),
    // но с кликабельными точками, которые открывают видео на нужной секунде через deep-link.
    const embedBase = ytId
      ? `https://www.youtube.com/embed/${ytId}`
      : rtId
      ? `https://rutube.ru/play/embed/${rtId}`
      : null;
    return (
      <div className="flex flex-col gap-3">
        <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          {embedBase ? (
            <iframe
              key={embedBase}
              src={`${embedBase}?autoplay=0&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              title="Видео маршрута"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Видео недоступно</div>
          )}
          {activePoint && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#152a4a]/85 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">
              <Icon name="Navigation" size={13} className="text-[#E8002D]" />
              Точка {activePoint.point_number}: {activePoint.title}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center">
          Нажмите на точку маршрута — видео откроется на нужном моменте в новой вкладке
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2">
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: isFs ? undefined : '16/9', height: isFs ? '100%' : undefined }}>
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full"
          playsInline
          onClick={togglePlay}
        />
        {activePoint && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#152a4a]/85 backdrop-blur-sm text-white text-xs font-semibold border border-white/10 pointer-events-none">
            <Icon name="Navigation" size={13} className="text-[#E8002D]" />
            Точка {activePoint.point_number}: {activePoint.title}
          </div>
        )}
        {!playing && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Icon name="Play" size={26} className="text-[#1a1a1a] ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Таймлайн с точками */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={e => seek(Number(e.target.value))}
          className="w-full accent-[#E8002D]"
        />
        <div className="relative h-3 -mt-1 pointer-events-none">
          {sortedPoints.map(p => (
            <div
              key={p.id}
              className="absolute top-0 w-1.5 h-1.5 rounded-full bg-[#E8002D]"
              style={{ left: `${duration ? (p.video_timestamp_sec / duration) * 100 : 0}%` }}
              title={p.title}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-[#152a4a] text-white flex items-center justify-center hover:opacity-90 transition-all">
            <Icon name={playing ? 'Pause' : 'Play'} size={15} className={playing ? '' : 'ml-0.5'} />
          </button>
          <span className="text-xs text-gray-400 font-mono">{fmtTime(current)} / {fmtTime(duration)}</span>
        </div>
        <div className="flex items-center gap-1">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${speed === s ? 'bg-[#E8002D] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {s}x
            </button>
          ))}
          <button onClick={toggleFullscreen} className="ml-1 w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-all">
            <Icon name={isFs ? 'Minimize' : 'Maximize'} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

RouteVideoPlayer.displayName = 'RouteVideoPlayer';
export default RouteVideoPlayer;