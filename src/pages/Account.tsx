import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';
import StudentLogin from '@/components/StudentLogin';
import { studentMe, studentLogout } from '@/api/auth';
import AccountHome from '@/components/account/AccountHome';
import PddSection from '@/components/account/PddSection';
import RouteSection from '@/components/account/RouteSection';
import ResultsSection from '@/components/account/ResultsSection';
import MistakesSection from '@/components/account/MistakesSection';
import NotificationsSection from '@/components/account/NotificationsSection';
import ProfileSection from '@/components/account/ProfileSection';

export type AccountTab = 'home' | 'pdd' | 'route' | 'results' | 'mistakes' | 'notifications' | 'profile';

const NAV_ITEMS: { key: AccountTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Главная', icon: 'Home' },
  { key: 'pdd', label: 'ПДД', icon: 'BookOpen' },
  { key: 'route', label: 'Экзаменационный маршрут', icon: 'Map' },
  { key: 'results', label: 'Результаты', icon: 'ClipboardList' },
  { key: 'mistakes', label: 'Мои ошибки', icon: 'AlertTriangle' },
  { key: 'notifications', label: 'Уведомления', icon: 'Bell' },
  { key: 'profile', label: 'Профиль', icon: 'User' },
];

// Компактный набор для нижней навигации на мобильных — все не влезают удобно,
// оставляем самые частые + "Профиль" как точку входа к остальным
const MOBILE_NAV_ITEMS: { key: AccountTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Главная', icon: 'Home' },
  { key: 'pdd', label: 'ПДД', icon: 'BookOpen' },
  { key: 'route', label: 'Маршрут', icon: 'Map' },
  { key: 'results', label: 'Итоги', icon: 'ClipboardList' },
  { key: 'profile', label: 'Профиль', icon: 'User' },
];

export default function AccountPage() {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [tab, setTab] = useState<AccountTab>('home');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    studentMe()
      .then(d => { setStudentName(d.name); setAuthState('ok'); })
      .catch(() => setAuthState('login'));
  }, []);

  useEffect(() => {
    if (authState !== 'ok') return;
    const interval = setInterval(() => {
      studentMe().catch(() => setAuthState('login'));
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [authState]);

  const handleLogout = () => { studentLogout(); setAuthState('login'); };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa]">
        <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f6fa]">
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: '#1a1a1a' }}>
          <Link to="/"><VectorLogo size="sm" inverted /></Link>
          <div className="w-px h-6 bg-white/20" />
          <span className="text-white/60 text-sm">Личный кабинет ученика</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#E8002D] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">В</div>
              <h2 className="font-montserrat font-bold text-xl text-[#1a1a1a]">Личный кабинет</h2>
              <p className="text-gray-400 text-sm mt-1">Прогресс, ПДД, тесты и результаты обучения</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <StudentLogin onSuccess={name => { setStudentName(name); setAuthState('ok'); }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-opensans flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-[#1a1a1a] min-h-screen sticky top-0">
        <div className="px-5 py-5">
          <Link to="/"><VectorLogo size="sm" inverted /></Link>
        </div>
        <div className="px-5 pb-4">
          <p className="text-white text-sm font-semibold truncate">{studentName}</p>
          <p className="text-white/40 text-xs">Личный кабинет ученика</p>
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                tab === item.key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
              {item.key === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-[#E8002D] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icon name="LogOut" size={17} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center gap-2.5">
            <Link to="/"><VectorLogo size="sm" inverted /></Link>
            <div className="w-px h-5 bg-white/20" />
            <span className="text-white/70 text-xs font-medium truncate max-w-[140px]">{studentName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setTab('notifications')} className="relative text-white/50 hover:text-white transition-colors p-1.5">
              <Icon name="Bell" size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#E8002D] w-2 h-2 rounded-full" />
              )}
            </button>
            <button onClick={handleLogout} className="text-white/50 hover:text-white transition-colors p-1.5">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
          {tab === 'home' && <AccountHome onNavigate={setTab} />}
          {tab === 'pdd' && <PddSection />}
          {tab === 'route' && <RouteSection />}
          {tab === 'results' && <ResultsSection />}
          {tab === 'mistakes' && <MistakesSection />}
          {tab === 'notifications' && <NotificationsSection onUnreadChange={setUnreadCount} />}
          {tab === 'profile' && <ProfileSection />}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {MOBILE_NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-colors ${
              tab === item.key ? 'text-[#E8002D]' : 'text-gray-400'
            }`}
          >
            <Icon name={item.icon} size={19} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}