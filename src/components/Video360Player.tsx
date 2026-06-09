import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  function startPlayer() {
    if (!containerRef.current || started) return;
    setStarted(true);

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.muted = false;
    video.style.display = 'none';
    document.body.appendChild(video);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0.001);

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let isDragging = false;
    let prevX = 0, prevY = 0;
    let lon = 0, lat = 0;

    function onPointerDown(e: PointerEvent) {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return;
      lon -= (e.clientX - prevX) * 0.3;
      lat += (e.clientY - prevY) * 0.3;
      lat = Math.max(-85, Math.min(85, lat));
      prevX = e.clientX;
      prevY = e.clientY;
    }
    function onPointerUp() {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.style.cursor = 'grab';

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
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
    video.play().catch(() => {});

    function onResize() {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener('resize', onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      video.pause();
      video.remove();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }

  return (
    <div className="mt-2 rounded-xl overflow-hidden bg-black select-none">
      {title && (
        <div className="px-3 py-2 bg-black/80 flex items-center gap-2">
          <span className="text-xs font-bold text-[#E8002D] uppercase tracking-wide">360°</span>
          <span className="text-sm text-white font-medium truncate">{title}</span>
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
            <p className="text-white/60 text-xs">Нажми для просмотра 360°</p>
            <p className="text-white/30 text-[10px]">Перетаскивай мышью / пальцем</p>
          </div>
        )}
      </div>
    </div>
  );
}
