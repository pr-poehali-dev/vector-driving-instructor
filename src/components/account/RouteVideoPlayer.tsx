import { useRef, useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

function getYtId(u: string): string | null {
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function getRtId(u: string): string | null {
  const m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

interface Props {
  url: string;
  title?: string;
  thumb?: string | null;
}

// Видеоплеер одной точки маршрута — аналогичен плееру в чат-боте с инструктором:
// превью с кнопкой Play, полноэкранный режим, поддержка прямых mp4 и YouTube/Rutube.
export default function RouteVideoPlayer({ url, title, thumb }: Props) {
  const [playing, setPlaying] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const ytId = getYtId(url);
  const rtId = getRtId(url);
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
    : rtId
    ? `https://rutube.ru/play/embed/${rtId}`
    : null;

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
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

  const handleFullscreen = () => { if (wrapperRef.current?.requestFullscreen) wrapperRef.current.requestFullscreen(); };
  const handleExitFullscreen = () => { if (document.exitFullscreen) document.exitFullscreen(); };

  if (!playing) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black cursor-pointer group" style={{ aspectRatio: '16/9' }} onClick={() => setPlaying(true)}>
        {thumb ? (
          <img src={thumb} alt={title || ''} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon name="Play" size={26} className="text-[#1a1a1a] ml-1" />
          </div>
        </div>
        {title && (
          <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium drop-shadow" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{title}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl overflow-hidden bg-black"
      style={isFs ? { width: '100vw', height: '100vh', borderRadius: 0 } : { aspectRatio: '16/9' }}
    >
      {isDirectVideo ? (
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full"
          autoPlay
          controls
          playsInline
        />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={title || 'Видео точки маршрута'}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Видео недоступно</div>
      )}
      <button
        onClick={isFs ? handleExitFullscreen : handleFullscreen}
        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 transition-colors z-10"
        title={isFs ? 'Свернуть' : 'На весь экран'}
      >
        <Icon name={isFs ? 'Minimize' : 'Maximize'} size={14} />
      </button>
    </div>
  );
}
