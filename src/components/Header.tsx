import React, { useState, useRef, useEffect } from "react";
import { 
  Bell, Globe, Sun, Moon, LogOut, User, AlertTriangle, 
  CheckCircle2, Info, Check, X, ShieldAlert, Menu, Settings, Users 
} from "lucide-react";
import { UserProfile, SystemNotification, translations } from "../types";
import { getNotifications, markNotificationAsRead, getAllUsers } from "../lib/db";

interface HeaderProps {
  user: UserProfile;
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
  onNavigateToNotifications?: () => void;
  setActiveTab?: (tab: string) => void;
  onToggleSidebar?: () => void;
}

export default function Header({
  user,
  language,
  setLanguage,
  theme,
  setTheme,
  onLogout,
  onNavigateToNotifications,
  setActiveTab,
  onToggleSidebar
}: HeaderProps) {
  const t = translations[language];
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    loadTotalUsers();
    const interval = setInterval(() => {
      loadNotifications();
      loadTotalUsers();
    }, 30000); // refresh notifications and users count every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error("Error loading notifications in header", err);
    }
  };

  const loadTotalUsers = async () => {
    try {
      const list = await getAllUsers();
      setTotalUsersCount(list.length);
    } catch (err) {
      console.error("Error loading total users in header", err);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.readBy.includes(user.uid)).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Brand & Gov Crest Info */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden transition-all cursor-pointer"
            id="mobile-sidebar-toggle"
            title="Toggle Sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}

        <div className="flex flex-col text-left">
          <span className="hidden md:inline font-sans text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-500 uppercase">
            {t.govLabel}
          </span>
          <span className="font-sans text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.appTitle}
          </span>
        </div>
      </div>

      {/* User Actions & Utility Bar */}
      <div className="flex items-center space-x-4">
        
        {/* Language Selector */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <button
            onClick={() => setLanguage("en")}
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              language === "en"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <span>EN</span>
          </button>
          <button
            onClick={() => setLanguage("si")}
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              language === "si"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <span>සිං</span>
          </button>
        </div>

        {/* Super Admin Total Users Badge */}
        {user.role === 'Super Admin' && (
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab("users");
            }}
            className="flex items-center space-x-1.5 h-9 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-400 dark:hover:bg-teal-950/40 transition-all cursor-pointer"
            title={language === 'si' ? "මුළු පරිශීලකයින්" : "Total Active Users"}
            id="super-admin-user-counter"
          >
            <Users className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="font-sans text-[10px] font-black uppercase tracking-wider hidden sm:inline">
              {language === 'si' ? "පරිශීලකයින්" : "Users"}:
            </span>
            <span className="font-mono text-[11px] font-black bg-teal-200/50 dark:bg-teal-900/50 px-1.5 py-0.5 rounded-md leading-none">
              {totalUsersCount}
            </span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
          title={t.theme}
        >
          {theme === "light" ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
            id="notification-bell-btn"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950 ring-1 ring-black/5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <span className="font-sans text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.notifications}
                </span>
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigateToNotifications) onNavigateToNotifications();
                  }}
                  className="font-sans text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active notifications.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => {
                    const isRead = notif.readBy.includes(user.uid);
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start space-x-2.5 rounded-lg p-2.5 text-left transition-colors ${
                          isRead ? "hover:bg-slate-50 dark:hover:bg-slate-900" : "bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30"
                        }`}
                      >
                        <div className="mt-0.5">
                          {notif.type === "error" ? (
                            <ShieldAlert className="h-4 w-4 text-red-600" />
                          ) : notif.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : notif.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                            {notif.title}
                          </p>
                          <p className="font-sans text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                            {notif.message}
                          </p>
                          <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition-all cursor-pointer"
            id="profile-dropdown-btn"
          >
            {/* Small Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-900 text-[11px] font-bold text-amber-500 ring-1 ring-amber-500/20">
              {(user?.displayName || user?.email || "U").substring(0, 2).toUpperCase()}
            </div>
            {/* Small Username */}
            <span className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[85px] sm:max-w-[120px] truncate">
              {user?.displayName || "Officer"}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950 ring-1 ring-black/5 animate-in fade-in duration-100 z-50 text-left">
              {/* Profile details */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="font-sans text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </p>
                <p className="font-sans text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowProfileModal(true);
                }}
                className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left font-sans text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                id="header-profile-btn"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>{language === 'si' ? "මගේ පැතිකඩ" : "My Profile"}</span>
              </button>

              {setActiveTab && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab("settings");
                  }}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left font-sans text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  id="header-settings-btn"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>{t.settings}</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left font-sans text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
                id="header-logout-btn"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                <span>{t.logout}</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150 text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-sans text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {language === "si" ? "පරිශීලක විස්තර" : "My Profile"}
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="mt-4 space-y-4">
              {/* Avatar and Main Info */}
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-900 text-lg font-black text-amber-500 ring-2 ring-amber-500/20 shadow-md">
                  {(user?.displayName || user?.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-white">
                    {user?.displayName || "Officer"}
                  </h4>
                  <p className="font-mono text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider mt-0.5">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>

              {/* Details List */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 space-y-3 font-sans text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 font-medium">{language === "si" ? "විද්‍යුත් තැපෑල" : "Email Address"}</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold">{user?.email}</span>
                </div>
                
                {user?.designation && (
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800/30">
                    <span className="text-slate-400 font-medium">{language === "si" ? "තනතුර" : "Designation"}</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{user?.designation}</span>
                  </div>
                )}

                {user?.department && (
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800/30">
                    <span className="text-slate-400 font-medium">{language === "si" ? "දෙපාර්තමේන්තුව" : "Department"}</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{user?.department}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800/30">
                  <span className="text-slate-400 font-medium">{language === "si" ? "ගිණුම් තත්ත්වය" : "Account Status"}</span>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
