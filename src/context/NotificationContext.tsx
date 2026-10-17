
import { Bell, Clock, Flame, Leaf, ShoppingBag, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'cart' | 'veg' | 'non-veg' | 'service' | 'info';
  createdAt: number;
  durationMs: number;
}

interface NotificationContextType {
  notifications: ToastNotification[];
  addNotification: (title: string, message: string, type: ToastNotification['type'], durationSec?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const timeoutsRef = useRef<{ [id: string]: NodeJS.Timeout }>({});

  const removeNotification = useCallback((id: string) => {
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (title: string, message: string, type: ToastNotification['type'], durationSec: number = 210) => {
      const id = `${Date.now()}-${Math.random()}`;
      const durationMs = durationSec * 1000;
      const newNotif: ToastNotification = { id, title, message, type, createdAt: Date.now(), durationMs };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 3)]); // Keep max 4 toasts

      timeoutsRef.current[id] = setTimeout(() => {
        removeNotification(id);
      }, durationMs);
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* Toast Render Stack */}
      <aside aria-label="Notifications" className="fixed bottom-6 left-4 sm:left-6 z-100 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
        {notifications.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#2a2622] bg-[#141210]/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                  item.type === 'veg'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : item.type === 'non-veg'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : item.type === 'service'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]'
                }`}
              >
                {item.type === 'veg' && <Leaf className="h-4 w-4" />}
                {item.type === 'non-veg' && <Flame className="h-4 w-4" />}
                {item.type === 'service' && <Bell className="h-4 w-4 animate-bounce" />}
                {item.type === 'cart' && <ShoppingBag className="h-4 w-4" />}
                {item.type === 'info' && <Clock className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white tracking-wide truncate">{item.title}</h4>
                  <button
                    type="button"
                    onClick={() => removeNotification(item.id)}
                    className="text-zinc-500 hover:text-white transition p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{item.message}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium">
                  <Clock className="h-3 w-3 text-amber-500/70" />
                  <span>Stays active ~3.5 min</span>
                </div>
              </div>
            </div>

            {/* Countdown animation bar */}
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-amber-500 to-amber-300"
              style={{
                width: '100%',
                animation: `shrinkBar ${item.durationMs}ms linear forwards`,
              }}
            />
          </div>
        ))}
      </aside>
      <style>{`
        @keyframes shrinkBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};