import { useState, useEffect } from "react";
import { 
  Bell, Check, ShieldAlert, AlertTriangle, Info, CheckCircle2, 
  Trash2, RefreshCw 
} from "lucide-react";
import { SystemNotification, translations, UserProfile } from "../types";
import { getNotifications, markNotificationAsRead } from "../lib/db";

interface NotificationsCenterProps {
  user: UserProfile;
  language: 'en' | 'si';
}

export default function NotificationsCenter({
  user,
  language
}: NotificationsCenterProps) {
  const t = translations[language];
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.readBy.includes(user.uid));
    try {
      await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.readBy.includes(user.uid)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
            <span>{t.notifications}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            System warnings, due date reminders, and officer assignment updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 font-sans text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all mt-3 md:mt-0 cursor-pointer"
            id="notif-mark-all-read-btn"
          >
            <Check className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No system notifications are active in your journal feed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => {
              const isRead = notif.readBy.includes(user.uid);
              
              let icon = <Info className="h-5 w-5 text-blue-600" />;
              let badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
              
              if (notif.type === 'error') {
                icon = <ShieldAlert className="h-5 w-5 text-red-600" />;
                badgeColor = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400";
              } else if (notif.type === 'warning') {
                icon = <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />;
                badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
              } else if (notif.type === 'success') {
                icon = <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
                badgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
              }

              return (
                <div
                  key={notif.id}
                  className={`flex items-start space-x-4 py-4.5 text-left transition-colors ${
                    isRead ? "opacity-75" : "bg-indigo-50/10 dark:bg-indigo-950/10 px-2 rounded-xl"
                  }`}
                >
                  <div className="mt-1 shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <p className="font-sans text-xs font-black text-slate-800 dark:text-slate-200">
                        {notif.title}
                      </p>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-red-600 block shrink-0" />
                      )}
                    </div>
                    <p className="font-sans text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300 mt-1 break-words">
                      {notif.message}
                    </p>
                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                      Generated on: {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {!isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="rounded-lg border border-slate-200 hover:bg-slate-100 p-1.5 text-slate-500 transition-all dark:border-slate-800 dark:hover:bg-slate-800"
                      title="Mark as read"
                      id={`notif-read-btn-${notif.id}`}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
