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

interface NavEntry { key: AccountTab; label: string; icon: string; badge?: 'new' }

const NAV_GROUPS: { title: string; items: NavEntry[] }[] = [
  {
    title: 'Обучение',
    items: [
      { key: 'home', label: 'Главная', icon: 'LayoutDashboard' },
      { key: 'route', label: 'Экзаменационный маршрут', icon: 'MapPin', badge: 'new' },
    ],
  },
  {
    title: 'Теория и экзамен',
    items: [
      { key: 'pdd', label: 'ПДД', icon: 'BookOpen' },
      { key: 'results', label: 'Результаты тестов', icon: 'BarChart2' },
      { key: 'mistakes', label: 'Работа над ошибками', icon: 'AlertTriangle' },
    ],
  },
  {
    title: 'Аккаунт',
    items: [
      { key: 'notifications', label: 'Уведомления', icon: 'Bell' },
      { key: 'profile', label: 'Профиль', icon: 'Settings' },
    ],
  },
];

const MOBILE_NAV_ITEMS: { key: AccountTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Главная', icon: 'LayoutDashboard' },
  { key: 'pdd', label: 'ПДД', icon: 'BookOpen' },
  { key: 'route', label: 'Маршрут', icon: 'MapPin' },
  { key: 'results', label: 'Итоги', icon: 'BarChart2' },
  { key: 'profile', label: 'Профиль', icon: 'Settings' },
];

const TAB_TITLES: Record<AccountTab, string> = {
  home: 'Личный кабинет ученика',
  pdd: 'ПДД',
  route: 'Экзаменационный маршрут Кургана',
  results: 'Мои результаты',
  mistakes: 'Работа над ошибками',
  notifications: 'Уведомления',
  profile: 'Профиль',
};

export default function AccountPage() {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [studentName, setStudentName] = useState('');
  const [tab, setTab] = useState<AccountTab>('home');
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Icon name="Loader" size={28} className="animate-spin text-[#E8002D]" />
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: '#152a4a' }}>
          <Link to="/"><VectorLogo size="sm" inverted /></Link>
          <div className="w-px h-6 bg-white/20" />
          <span className="text-white/60 text-sm">Личный кабинет ученика</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8002D] to-[#c52233] flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-lg shadow-red-500/30">В</div>
              <h2 className="font-montserrat font-bold text-xl text-[#152a4a]">Личный кабинет</h2>
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
    <div className="min-h-screen bg-[#f8fafc] font-opensans flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-0">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md shadow-red-500/30" style={{ background: 'linear-gradient(135deg, #E8002D, #c52233)' }}>
              В
            </div>
            <div className="min-w-0">
              <h1 className="font-montserrat font-black text-sm text-[#152a4a] leading-tight">ВЕКТОР 45</h1>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Автоакадемия • Курган</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">{group.title}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                      tab === item.key ? 'bg-red-50 text-[#E8002D] font-semibold' : 'text-gray-500 hover:text-[#152a4a] hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={item.icon} size={17} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge === 'new' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#E8002D' }}>NEW</span>
                    )}
                    {item.key === 'notifications' && unreadCount > 0 && (
                      <span className="bg-[#E8002D] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#152a4a] text-sm flex-shrink-0">
            {studentName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#152a4a] truncate">{studentName}</p>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-[#E8002D] transition-colors">Выйти</button>
          </div>
          <Icon name="LogOut" size={16} className="text-gray-300 flex-shrink-0" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-8 h-[68px] flex-shrink-0 bg-white border-b border-gray-200 sticky top-0 z-30">
          <h2 className="font-montserrat font-bold text-lg text-[#152a4a]">{TAB_TITLES[tab]}</h2>
          <button onClick={() => setTab('notifications')} className="relative w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#152a4a] hover:border-gray-300 transition-all">
            <Icon name="Bell" size={17} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E8002D] border-2 border-white" />}
          </button>
        </header>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#152a4a' }}>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMobileMenuOpen(true)} className="text-white/70 p-1">
              <Icon name="Menu" size={20} />
            </button>
            <Link to="/"><VectorLogo size="sm" inverted /></Link>
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

        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          {tab === 'home' && <AccountHome onNavigate={setTab} studentName={studentName} />}
          {tab === 'pdd' && <PddSection />}
          {tab === 'route' && <RouteSection />}
          {tab === 'results' && <ResultsSection />}
          {tab === 'mistakes' && <MistakesSection />}
          {tab === 'notifications' && <NotificationsSection onUnreadChange={setUnreadCount} />}
          {tab === 'profile' && <ProfileSection />}
        </main>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-72 bg-white h-full flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <VectorLogo size="sm" />
              <button onClick={() => setMobileMenuOpen(false)}><Icon name="X" size={20} className="text-gray-400" /></button>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
              {NAV_GROUPS.map(group => (
                <div key={group.title} className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">{group.title}</p>
                  {group.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setTab(item.key); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        tab === item.key ? 'bg-red-50 text-[#E8002D] font-semibold' : 'text-gray-500'
                      }`}
                    >
                      <Icon name={item.icon} size={17} />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500">
                <Icon name="LogOut" size={17} />
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

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