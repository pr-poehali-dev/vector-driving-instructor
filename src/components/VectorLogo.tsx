interface VectorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export default function VectorLogo({ size = 'md', inverted = false }: VectorLogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-2xl', sub: 'text-[10px]' },
    lg: { icon: 52, text: 'text-3xl', sub: 'text-xs' },
  };
  const s = sizes[size];
  const textColor = inverted ? 'text-white' : 'text-[#0d2147]';
  const subColor = inverted ? 'text-white/70' : 'text-[#0d2147]/60';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-sm flex-shrink-0"
        style={{ width: s.icon, height: s.icon, background: '#d42b2b' }}
      >
        <svg width={s.icon * 0.65} height={s.icon * 0.65} viewBox="0 0 24 24" fill="none">
          <polygon points="3,18 12,4 21,18" fill="white" />
          <polygon points="7,18 12,9 17,18" fill="#d42b2b" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-montserrat font-800 tracking-wider uppercase ${s.text} ${textColor}`}
          style={{ fontWeight: 800, letterSpacing: '0.1em' }}>
          ВЕКТОР
        </span>
        <span className={`font-opensans uppercase tracking-[0.18em] ${s.sub} ${subColor}`}>
          АВТОШКОЛА
        </span>
      </div>
    </div>
  );
}
