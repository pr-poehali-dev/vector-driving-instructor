import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { createSupportTicket } from '@/api/support';

interface Props {
  studentId: number | null;
  studentName: string;
  onClose: () => void;
}

export default function SupportModal({ studentId, studentName, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      await createSupportTicket(message.trim(), studentId, studentName);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить обращение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon name="LifeBuoy" size={17} className="text-[#E8002D]" />
            <h3 className="font-montserrat font-bold text-base text-[#1a1a1a]">Написать в поддержку</h3>
          </div>
          <button onClick={onClose}><Icon name="X" size={18} className="text-gray-400" /></button>
        </div>

        {sent ? (
          <div className="px-6 py-8 text-center">
            <Icon name="CheckCircle2" size={36} className="mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-[#1a1a1a] mb-1">Обращение отправлено</p>
            <p className="text-sm text-gray-400">Мы разберём вопрос в ближайшее время и свяжемся с вами</p>
            <button onClick={onClose}
              className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ background: '#E8002D' }}>
              Понятно
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-3">
            <p className="text-xs text-gray-400">
              Опишите проблему или вопрос — например, если бот ответил неточно, что-то не работает
              или нужна помощь администратора. Мы свяжемся с вами.
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Опишите проблему подробно..."
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8002D] resize-none transition-colors"
            />
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full py-3 rounded-xl text-white font-montserrat font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: '#E8002D' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Loader" size={15} className="animate-spin" />
                  Отправка...
                </span>
              ) : 'Отправить обращение'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
