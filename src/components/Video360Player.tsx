import { useEffect, useRef, useState } from 'react';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  const drag = useRef({ isDown: false, startX: 0, startY: 0, lon: 0, lat: 0, curLon: 0, curLat: 0 });

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d')!;
    const d = drag.current;

    let raf: number;
    const draw = () => {
      raf = requestAnimationFrame(draw);

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const W = canvas.width;
      const H = canvas.height;

      if (!vw || !vh || video.readyState < 2) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`readyState: ${video.readyState} | vw: ${vw} | vh: ${vh}`, 10, 20);
        return;
      }

      const fovH = 90;
      const fovV = (fovH * H) / W;
      const srcW = (fovH / 360) * vw;
      const srcH = (fovV / 180) * vh;

      const cx = (((d.curLon % 360) + 360) % 360 / 360) * vw;
      const cy = ((90 - d.curLat) / 180) * vh;
      const sx = cx - srcW / 2;
      const sy = Math.max(0, Math.min(vh - srcH, cy - srcH / 2));

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (sx >= 0 && sx + srcW <= vw) {
        ctx.drawImage(video, sx, sy, srcW, srcH, 0, 0, W, H);
      } else {
        const sxWrap = ((sx % vw) + vw) % vw;
        const leftW = vw - sxWrap;
        const rightW = srcW - leftW;
        const scale = W / srcW;
        ctx.drawImage(video, sxWrap, sy, leftW, srcH, 0, 0, leftW * scale, H);
        ctx.drawImage(video, 0, sy, rightW, srcH, leftW * scale, 0, rightW * scale, H);
      }
    };

    const onDown = (e: PointerEvent) => {
      d.isDown = true;
      d.startX = e.clientX; d.startY = e.clientY;
      d.lon = d.curLon; d.lat = d.curLat;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!d.isDown) return;
      d.curLon = d.lon - (e.clientX - d.startX) * 0.3;
      d.curLat = Math.max(-60, Math.min(60, d.lat + (e.clientY - d.startY) * 0.2));
    };
    const onUp = () => { d.isDown = false; canvas.style.cursor = 'grab'; };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [started]);

  const handlePlay = () => {
    // play() вызываем синхронно из клика — доверенный жест браузера
    videoRef.current?.play().catch(() => {});
    setStarted(true);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden bg-[#111] select-none">
      <div className="px-3 py-2 bg-black/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-[#E8002D] uppercase tracking-widest flex-shrink-0">360°</span>
          {title && <span className="text-sm text-white font-medium truncate">{title}</span>}
        </div>
        {started && (
          <button onClick={toggleMute} className="flex-shrink-0 text-white/50 hover:text-white transition-colors p-1">
            {muted
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            }
          </button>
        )}
      </div>

      <div style={{ width: '100%', height: 240, position: 'relative', background: '#111' }}>
        {/* Видео тег в DOM с самого начала — play() вызывается синхронно из клика */}
        {/* Видео должно иметь реальные размеры — иначе браузер не декодирует кадры */}
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, pointerEvents: 'none', top: 0, left: 0, objectFit: 'cover' }}
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={240}
          style={{ width: '100%', height: '100%', display: started ? 'block' : 'none', cursor: 'grab' }}
        />

        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-14 h-14 rounded-full bg-[#E8002D] flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <p className="text-white/50 text-xs">Нажми для просмотра 360°</p>
            <p className="text-white/25 text-[10px]">Перетаскивай для управления</p>
          </div>
        )}
      </div>
    </div>
  );
}