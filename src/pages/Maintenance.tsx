import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a1a] font-opensans px-6 py-10 text-center relative overflow-hidden">
      {/* Декоративные дорожные полосы */}
      <div className="absolute inset-x-0 bottom-0 h-2 flex">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="flex-1 h-full mx-1" style={{ background: i % 2 === 0 ? '#E8002D' : 'transparent' }} />
        ))}
      </div>

      <div className="mb-8">
        <VectorLogo size="md" inverted />
      </div>

      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse" style={{ background: 'rgba(232,0,45,0.15)' }}>
        <Icon name="Cone" size={36} className="text-[#E8002D]" fallback="Construction" />
      </div>

      <h1 className="font-montserrat font-black text-2xl md:text-4xl text-white mb-3 leading-tight">
        Технические работы
      </h1>
      <p className="text-white/60 text-sm md:text-base max-w-md mb-8 leading-relaxed">
        Мы улучшаем виртуального инструктора «Вектор» — совсем скоро сайт снова будет доступен.
        Спасибо за терпение, скоро увидимся на дороге!
      </p>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs mb-10">
        <Icon name="Clock" size={13} />
        Обычно это занимает не больше пары часов
      </div>

      <a
        href="tel:+73522509335"
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-montserrat font-bold text-sm shadow-xl hover:opacity-90 transition-all"
        style={{ background: '#E8002D' }}
      >
        <Icon name="Phone" size={16} />
        8 (3522) 50-93-35
      </a>
      <p className="text-white/30 text-xs mt-4">г. Курган, 4-й микрорайон, 32</p>
    </div>
  );
}
