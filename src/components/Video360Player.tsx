import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!started) return;
    const mount = mountRef.current;
    const video = videoElRef.current;
    if (!mount || !video) return;

    const timer = setTimeout(() => {
      const w = mount.offsetWidth || 320;
      const h = mount.offsetHeight || 240;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const canvas = renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.top = '0'; canvas.style.left = '0';
      canvas.style.width = '100%'; canvas.style.height = '100%';
      canvas.style.cursor = 'grab';
      mount.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const geo = new THREE.SphereGeometry(500, 60, 40);
      geo.scale(-1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({ map: texture });
      scene.add(new THREE.Mesh(geo, mat));

      let lon = 0, lat = 0, isDragging = false, px = 0, py = 0;

      const onDown = (e: PointerEvent) => {
        isDragging = true; px = e.clientX; py = e.clientY;
        canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
      };
      const onMove = (e: PointerEvent) => {
        if (!isDragging) return;
        lon -= (e.clientX - px) * 0.25;
        lat = Math.max(-85, Math.min(85, lat + (e.clientY - py) * 0.25));
        px = e.clientX; py = e.clientY;
      };
      const onUp = () => { isDragging = false; canvas.style.cursor = 'grab'; };

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointerleave', onUp);

      let animId: number;
      const tick = () => {
        animId = requestAnimationFrame(tick);
        if (video.readyState >= 2) texture.needsUpdate = true;
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta),
        );
        renderer.render(scene, camera);
      };
      tick();

      const onResize = () => {
        const nw = mount.offsetWidth; const nh = mount.offsetHeight;
        camera.aspect = nw / nh; camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      (mount as unknown as { _destroy: () => void })._destroy = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointerleave', onUp);
        renderer.dispose(); geo.dispose(); mat.dispose(); texture.dispose();
        if (mount.contains(canvas)) mount.removeChild(canvas);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      (mountRef.current as unknown as { _destroy?: () => void })?._destroy?.();
    };
  }, [started]);

  const toggleMute = () => {
    if (!videoElRef.current) return;
    videoElRef.current.muted = !muted;
    setMuted(m => !m);
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden bg-black select-none">
      <div className="px-3 py-2 bg-black/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-[#E8002D] uppercase tracking-wide flex-shrink-0">360°</span>
          {title && <span className="text-sm text-white font-medium truncate">{title}</span>}
        </div>
        {started && (
          <button onClick={toggleMute} className="flex-shrink-0 text-white/60 hover:text-white transition-colors">
            {muted
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>
        )}
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '240px', position: 'relative', background: '#111' }}>
        {/* Видео тег в DOM без crossOrigin — обходит CORS ограничения WebGL */}
        <video
          ref={videoElRef}
          src={videoUrl}
          loop
          playsInline
          muted={muted}
          autoPlay={started}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />

        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
            onClick={() => setStarted(true)}
          >
            <div className="w-14 h-14 rounded-full bg-[#E8002D] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <p className="text-white/60 text-xs mt-1">Нажми для просмотра 360°</p>
            <p className="text-white/30 text-[10px]">Перетаскивай мышью или пальцем</p>
          </div>
        )}
      </div>
    </div>
  );
}
