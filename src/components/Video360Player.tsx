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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!started) return;
    const mount = mountRef.current;
    if (!mount) return;

    console.log('[360] init, mount size:', mount.clientWidth, mount.clientHeight);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    const w = mount.clientWidth || mount.offsetWidth || 320;
    const h = mount.clientHeight || mount.offsetHeight || 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

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
    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.style.display = 'block';

    const onDown = (e: PointerEvent) => { isDragging = true; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const onMove = (e: PointerEvent) => { if (!isDragging) return; lon -= (e.clientX - px) * 0.25; lat = Math.max(-85, Math.min(85, lat + (e.clientY - py) * 0.25)); px = e.clientX; py = e.clientY; };
    const onUp = () => { isDragging = false; el.style.cursor = 'grab'; };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);

    let animId: number;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (video.readyState >= 2) texture.needsUpdate = true;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
      renderer.render(scene, camera);
    };
    tick();

    video.play()
      .then(() => console.log('[360] playing'))
      .catch(e => console.error('[360] play error:', e));

    const onResize = () => {
      const nw = mount.clientWidth; const nh = mount.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      video.pause(); video.src = '';
      renderer.dispose(); geo.dispose(); mat.dispose(); texture.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, [started, videoUrl]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
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

      {/* mount всегда в DOM — чтобы размеры были корректны */}
      <div ref={mountRef} style={{ width: '100%', height: '240px', position: 'relative', background: '#111' }}>
        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
            style={{ background: '#111' }}
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
