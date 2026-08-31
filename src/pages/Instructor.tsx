import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import VectorLogo from '@/components/VectorLogo';
import { instructorLogin, instructorMe, instructorLogout, InstructorSession } from '@/api/instructor';
import KpiTab from '@/components/instructor/KpiTab';
import RegistratorTab from '@/components/instructor/RegistratorTab';
import KnowledgeBaseTab from '@/components/instructor/KnowledgeBaseTab';
import PddTestTab from '@/components/instructor/PddTestTab';

type Tab = 'kpi' | 'registrator' | 'knowledge' | 'test';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'kpi', label: 'Общая', icon: 'LayoutDashboard' },
  { key: 'registrator', label: 'Регистратор', icon: 'Video' },
  { key: 'knowledge', label: 'База знаний', icon: 'BookOpen' },
  { key: 'test', label: 'Тесты ПДД', icon: 'FileCheck2' },
];

function LoginScreen({ onSuccess }: { onSuccess: (s: InstructorSession) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await instructorLogin(login.trim(), password);
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-opensans">
      <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-700">
          <div className="flex justify-center mb-4"><VectorLogo size="md" inverted /></div>
          <p className="text-slate-400 text-sm mt-2">Кабинет мастера ПОУ</p>
        </div>
        <form onSubmit={submit} className="px-8 py-7 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Логин</label>
            <input value={login} onChange={e => setLogin(e.target.value)} required placeholder="smirnov"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-rose-600 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Пароль</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Пароль"
                className="w-full pr-10 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-rose-600 transition-colors" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon name={showPw ? 'EyeOff' : 'Eye'} size={15} />
              </button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm"><Icon name="AlertCircle" size={14} />{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-montserrat font-bold text-sm transition-colors disabled:opacity-60">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InstructorDashboard({ session, onLogout }: { session: InstructorSession; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('kpi');
  const initials = session.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-900 font-opensans">
      <header className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <VectorLogo size="sm" inverted />
            <div className="hidden sm:block w-px h-8 bg-slate-700" />
            <span className="hidden sm:block text-slate-400 text-sm whitespace-nowrap">Кабинет мастера ПОУ</span>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:block text-right min-w-0">
              <p className="text-white text-sm font-semibold truncate">{session.name}</p>
              <p className="text-slate-500 text-xs truncate">{session.branch_name} · {session.car_model}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors p-1.5 flex-shrink-0">
              <Icon name="LogOut" size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-nowrap md:flex-wrap gap-1 p-1 bg-slate-800 rounded-2xl border border-slate-700 md:w-fit overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  tab === t.key ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'kpi' && <KpiTab />}
        {tab === 'registrator' && <RegistratorTab />}
        {tab === 'knowledge' && <KnowledgeBaseTab />}
        {tab === 'test' && <PddTestTab />}
      </div>
    </div>
  );
}

export default function InstructorPage() {
  const [session, setSession] = useState<InstructorSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    instructorMe()
      .then(s => { setSession(s); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      instructorMe().catch(() => setSession(null));
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogout = () => { instructorLogout(); setSession(null); };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Icon name="Loader" size={28} className="animate-spin text-rose-600" />
      </div>
    );
  }

  if (!session) return <LoginScreen onSuccess={setSession} />;

  return <InstructorDashboard session={session} onLogout={handleLogout} />;
}
