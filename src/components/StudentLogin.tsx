import { useState } from 'react';
import VectorLogo from '@/components/VectorLogo';
import Icon from '@/components/ui/icon';
import { studentLogin } from '@/api/auth';

interface Props {
  onSuccess: (name: string) => void;
}

export default function StudentLogin({ onSuccess }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await studentLogin(login.trim(), password);
      onSuccess(data.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-opensans">
      {/* Card */}
      <div className="w-full bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: '#1a1a1a' }}>
          <div className="flex justify-center mb-4">
            <VectorLogo size="md" inverted />
          </div>
          <p className="text-white/50 text-sm mt-2">Вход для учеников</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Логин
            </label>
            <div className="relative">
              <Icon name="User" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Ваш логин"
                autoComplete="username"
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Icon name="Lock" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ваш пароль"
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon name={showPw ? 'EyeOff' : 'Eye'} size={15} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm animate-fade-in">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-montserrat font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 mt-1"
            style={{ background: '#E8002D' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="Loader" size={15} className="animate-spin" />
                Вход...
              </span>
            ) : 'Войти'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-1">
            Логин и пароль выдаёт ваш инструктор
          </p>
        </form>
      </div>

    </div>
  );
}