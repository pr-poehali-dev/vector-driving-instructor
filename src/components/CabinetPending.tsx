import Icon from '@/components/ui/icon';

// Серверная заглушка для кабинетов (ssr: false): повторяет экран загрузки страницы.
export default function CabinetPending({ bg, spin, label }: { bg: string; spin: string; label: string }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <Icon name="Loader" size={28} className={`animate-spin ${spin}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
