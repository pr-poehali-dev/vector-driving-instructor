import { useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularVideoAdapter } from '@photo-sphere-viewer/equirectangular-video-adapter';
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/video-plugin/index.css';

interface Props {
  videoUrl: string;
  title?: string | null;
}

export default function Video360Player({ videoUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = new Viewer({
      container: containerRef.current,
      adapter: [EquirectangularVideoAdapter, { autoplay: false, muted: false }],
      panorama: { source: videoUrl },
      plugins: [
        [VideoPlugin, { autoplay: false, muted: false }],
      ],
      navbar: ['video-play', 'video-volume', 'fullscreen'],
      loadingImg: undefined,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
    });

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [videoUrl]);

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      {title && (
        <div className="px-3 py-2 bg-black/80 flex items-center gap-2">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">360°</span>
          <span className="text-sm text-white font-medium truncate">{title}</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '260px' }} />
    </div>
  );
}
