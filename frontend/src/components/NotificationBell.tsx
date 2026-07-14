import { useEffect, useRef, useState } from 'react';
import { useNotificationsStore, notificationText } from '../store/notifications';
import { fmtDateTime } from '../utils';
import { IconBell } from './Icons';
import EmptyState from './EmptyState';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore((s) => s.unread);
  const markRead = useNotificationsStore((s) => s.markRead);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="bell" ref={ref}>
      <button
        className="icon-btn bell__btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
      >
        <IconBell size={20} />
        {unread > 0 && <span className="bell__count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="bell__dropdown">
          <div className="bell__dropdown-header">Notifications</div>
          {items.length === 0 ? (
            <EmptyState title="No notifications" message="You are all caught up." />
          ) : (
            <ul className="bell__list">
              {items.slice(0, 12).map((n) => (
                <li
                  key={n.id}
                  className={`bell__item ${n.read ? '' : 'bell__item--unread'}`}
                  onClick={() => void markRead(n.id)}
                >
                  <span className="bell__item-text">{notificationText(n)}</span>
                  <span className="bell__item-time">{fmtDateTime(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
