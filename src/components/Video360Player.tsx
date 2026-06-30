import { useEffect, useRef, useState } from 'react';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!started || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    // Угол обзора в градусах (по горизонтали)
    let lon = 0; // горизонтальный угол (0..360)
    let lat = 0; // вертикальный угол (-60..60)
    let isDown = false;
    let startX = 0, startY = 0, startLon = 0, startLat = 0;

    const W = canvas.width;
    const H = canvas.height;

    let raf: number;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (video.readyState < 2) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      // Equirectangular: берём фрагмент из видео по текущему углу
      // lon 0..360 → x по всей ширине видео
      // lat -60..60 → y по части высоты видео

      const fovH = 90; // угол обзора 90°
      const fovV = (fovH * H) / W;

      // Вычисляем фрагмент источника
      const srcW = (fovH / 360) * vw;
      const srcH = (fovV / 180) * vh;

      // Центр по lon (с wrap-around) и lat
      const cx = ((lon % 360) / 360) * vw;
      const cy = ((90 - lat) / 180) * vh;

      const sx = cx - srcW / 2;
      const sy = cy - srcH / 2;

      // Сначала заливаем чёрным
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (sx >= 0 && sx + srcW <= vw) {
        // Простой случай — без wrap-around
        ctx.drawImage(video, sx, sy, srcW, srcH, 0, 0, W, H);
      } else {
        // Wrap-around по горизонтали
        const leftW = vw - ((sx % vw + vw) % vw);
        const rightW = srcW - leftW;
        const scaleX = W / srcW;
        ctx.drawImage(video, (sx % vw + vw) % vw, sy, leftW, srcH, 0, 0, leftW * scaleX, H);
        ctx.drawImage(video, 0, sy, rightW, srcH, leftW * scaleX, 0, rightW * scaleX, H);
      }
    };

    const onDown = (e: PointerEvent) => {
      isDown = true;
      startX = e.clientX; startY = e.clientY;
      startLon = lon; startLat = lat;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      lon = startLon - (e.clientX - startX) * 0.3;
      lat = Math.max(-60, Math.min(60, startLat + (e.clientY - startY) * 0.2));
    };
    const onUp = () => { isDown = false; canvas.style.cursor = 'grab'; };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    video.addEventListener('canplay', () => {
      video.play().catch(() => {});
      draw();
    }, { once: true });
    video.load();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      video.pause();
      video.src = '';
      videoRef.current = null;
    };
  }, [started, videoUrl]);

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
        <canvas
          ref={canvasRef}
          width={640}
          height={240}
          style={{ width: '100%', height: '100%', display: started ? 'block' : 'none', cursor: 'grab' }}
        />
        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => setStarted(true)}
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
