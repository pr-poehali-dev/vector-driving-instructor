const LOGO_URL = 'https://cdn.poehali.dev/projects/370344a9-a9ba-49da-84a7-a1af7d9aae57/bucket/7e3346dd-129a-43c3-b1be-b88f59431d14.png';

interface VectorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export default function VectorLogo({ size = 'md', inverted = false }: VectorLogoProps) {
  const heights = { sm: 36, md: 48, lg: 64 };
  const h = heights[size];

  return (
    <img
      src={LOGO_URL}
      alt="Вектор — Федеральная академия вождения"
      style={{
        height: h,
        width: 'auto',
        filter: inverted ? 'brightness(0) invert(1)' : 'none',
        objectFit: 'contain',
      }}
    />
  );
}
