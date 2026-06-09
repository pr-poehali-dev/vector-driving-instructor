import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  function startPlayer() {
    if (!containerRef.current || started) return;
    setStarted(true);

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const w = rect.width || 320;
    const h = rect.height || 240;

    // Video
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.muted = true; // обязательно для autoplay в браузере
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0.001);

    // Texture from video
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Inside-out sphere = equirectangular 360
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    scene.add(new THREE.Mesh(geometry, material));

    // Drag controls
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let lon = 0, lat = 0;

    const el = renderer.domElement;
    el.style.cursor = 'grab';

    function onDown(e: PointerEvent) {
      isDragging = true;
      prevX = e.clientX; prevY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    }
    function onMove(e: PointerEvent) {
      if (!isDragging) return;
      lon -= (e.clientX - prevX) * 0.25;
      lat += (e.clientY - prevY) * 0.25;
      lat = Math.max(-85, Math.min(85, lat));
      prevX = e.clientX; prevY = e.clientY;
    }
    function onUp() { isDragging = false; el.style.cursor = 'grab'; }

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);

    // Render loop
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      // Критично: без этого VideoTexture не обновляется — экран чёрный
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        texture.needsUpdate = true;
      }
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );
      renderer.render(scene, camera);
    }
    animate();

    // Play (muted — браузер разрешит)
    console.log('[360] starting play, src=', videoUrl);
    video.addEventListener('loadeddata', () => console.log('[360] video loadeddata, readyState=', video.readyState));
    video.addEventListener('error', (e) => console.error('[360] video error:', video.error, e));
    video.addEventListener('playing', () => console.log('[360] video playing!'));
    video.play()
      .then(() => console.log('[360] play() resolved'))
      .catch(err => console.error('[360] play() rejected:', err));

    // Resize
    function onResize() {
      const r = container.getBoundingClientRect();
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    }
    window.addEventListener('resize', onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      video.pause(); video.remove();
      renderer.dispose(); geometry.dispose(); material.dispose(); texture.dispose();
      if (container.contains(el)) container.removeChild(el);
    };
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const newMuted = !muted;
    videoRef.current.muted = newMuted;
    setMuted(newMuted);
  }

  return (
    <div className="mt-2 rounded-xl overflow-hidden bg-black select-none">
      {title && (
        <div className="px-3 py-2 bg-black/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[#E8002D] uppercase tracking-wide flex-shrink-0">360°</span>
            <span className="text-sm text-white font-medium truncate">{title}</span>
          </div>
          {started && (
            <button
              onClick={toggleMute}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              title={muted ? 'Включить звук' : 'Выключить звук'}
            >
              {muted
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              }
            </button>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '240px', position: 'relative' }}>
        {!started && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-900"
            onClick={startPlayer}
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