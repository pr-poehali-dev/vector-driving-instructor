import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const stateRef = useRef<{ video: HTMLVideoElement; toggleMute: () => void } | null>(null);

  useEffect(() => {
    if (!started || !mountRef.current) return;

    const mount = mountRef.current;

    // 1. Создаём видео
    const video = document.createElement('video');
    video.src = videoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    stateRef.current = {
      video,
      toggleMute: () => {
        video.muted = !video.muted;
        setMuted(video.muted);
      },
    };

    // 2. Three.js
    const W = mount.offsetWidth || 300;
    const H = 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.cursor = 'grab';
    mount.appendChild(canvas);

    const camera = new THREE.PerspectiveCamera(75, W / H, 1, 1100);
    const scene = new THREE.Scene();

    // Сфера вывернута наизнанку — equirectangular проекция
    const geo = new THREE.SphereGeometry(500, 60, 40);
    geo.scale(-1, 1, 1);

    // Текстура из видео
    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;

    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
    scene.add(mesh);

    // 3. Управление мышью / тачем
    let lon = 0, lat = 0;
    let isDown = false, startX = 0, startY = 0, startLon = 0, startLat = 0;

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
      lat = Math.max(-85, Math.min(85, startLat + (e.clientY - startY) * 0.3));
    };
    const onUp = () => { isDown = false; canvas.style.cursor = 'grab'; };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // 4. Рендер-цикл
    let raf: number;
    const render = () => {
      raf = requestAnimationFrame(render);
      tex.needsUpdate = true;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      renderer.render(scene, camera);
    };
    render();

    // 5. Запускаем видео — ждём canplay
    const onCanPlay = () => { video.play().catch(() => {}); };
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.load();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      video.pause();
      video.src = '';
      renderer.dispose();
      geo.dispose();
      tex.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
      stateRef.current = null;
    };
  }, [started, videoUrl]);

  return (
    <div className="mt-2 rounded-xl overflow-hidden bg-[#111] select-none">
      {/* Шапка */}
      <div className="px-3 py-2 bg-black/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-[#E8002D] uppercase tracking-widest flex-shrink-0">360°</span>
          {title && <span className="text-sm text-white font-medium truncate">{title}</span>}
        </div>
        {started && (
          <button
            onClick={() => stateRef.current?.toggleMute()}
            className="flex-shrink-0 text-white/50 hover:text-white transition-colors p-1"
          >
            {muted
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            }
          </button>
        )}
      </div>

      {/* Контейнер */}
      <div ref={mountRef} style={{ width: '100%', height: 240, position: 'relative' }}>
        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#111]"
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
