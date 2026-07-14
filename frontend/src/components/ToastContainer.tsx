import { useToastStore } from '../store/toasts';
import { IconX } from './Icons';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <span className="toast__msg">{t.message}</span>
          <button className="icon-btn toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <IconX size={14} />
          </button>
          <span className="toast__progress" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
