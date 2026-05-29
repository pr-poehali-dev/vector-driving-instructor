interface VectorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export default function VectorLogo({ size = 'md', inverted = false }: VectorLogoProps) {
  const sizes = {
    sm: { wrap: 44, heart: 22, text: 'text-xl', sub: 'text-[9px]', gap: 'gap-2' },
    md: { wrap: 56, heart: 28, text: 'text-2xl', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { wrap: 72, heart: 36, text: 'text-3xl', sub: 'text-xs', gap: 'gap-3' },
  };
  const s = sizes[size];
  const textColor = inverted ? '#ffffff' : '#1a1a1a';
  const subColor = inverted ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,26,0.5)';

  return (
    <div className={`flex items-center ${s.gap}`}>
      {/* Heart-arrow logo mark */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: s.wrap, height: s.wrap }}
      >
        <svg
          width={s.wrap}
          height={s.wrap}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Red background square with rounded corners */}
          <rect width="56" height="56" rx="10" fill="#E8002D" />
          {/* Heart shape */}
          <path
            d="M28 42C28 42 12 33 12 22.5C12 17.8 15.8 14 20.5 14C23.4 14 26 15.5 28 17.8C30 15.5 32.6 14 35.5 14C40.2 14 44 17.8 44 22.5C44 33 28 42 28 42Z"
            fill="white"
          />
          {/* Arrow/vector inside heart */}
          <path
            d="M22 29L28 23L34 29M28 23V35"
            stroke="#E8002D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-montserrat ${s.text} tracking-wide`}
          style={{ fontWeight: 900, color: textColor, letterSpacing: '0.05em' }}
        >
          Вектор
        </span>
        <span
          className={`font-opensans ${s.sub} uppercase tracking-[0.2em]`}
          style={{ color: subColor, fontWeight: 500 }}
        >
          Академия вождения
        </span>
      </div>
    </div>
  );
}
