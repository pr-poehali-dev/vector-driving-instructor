import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getNotifications, markNotificationRead, NotificationItem } from '@/api/cabinet';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 2) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD < 7) return `${diffD} д. назад`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotificationsSection({ onUnreadChange }: { onUnreadChange?: (count: number) => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getNotifications().then(d => {
      setItems(d.notifications);
      onUnreadChange?.(d.notifications.filter(n => !n.is_read).length);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async (n: NotificationItem) => {
    if (!n.is_read) {
      await markNotificationRead(n.id).catch(() => {});
      setItems(list => {
        const next = list.map(x => x.id === n.id ? { ...x, is_read: true } : x);
        onUnreadChange?.(next.filter(x => !x.is_read).length);
        return next;
      });
    }
  };

  if (loading) return (
    <div className="py-20 text-center text-gray-400"><Icon name="Loader" size={24} className="animate-spin mx-auto" /></div>
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-montserrat font-bold text-lg text-[#152a4a] mb-1">Уведомления</h2>
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <Icon name="Bell" size={28} className="mx-auto mb-2 text-gray-200" />
          Уведомлений пока нет
        </div>
      ) : (
        items.map(n => (
          <button
            key={n.id}
            onClick={() => handleOpen(n)}
            className={`text-left bg-white rounded-2xl shadow-sm border p-4 transition-all ${n.is_read ? 'border-gray-100' : 'border-red-100'}`}
          >
            <div className="flex items-start gap-3">
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#E8002D] mt-1.5 flex-shrink-0" />}
              <div className={`flex-1 min-w-0 ${n.is_read ? 'ml-5' : ''}`}>
                <p className="text-sm font-semibold text-[#152a4a]">{n.title}</p>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{fmtDate(n.created_at)}</p>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
