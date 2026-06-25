import { 
  LayoutDashboard, FileClock, CheckCircle2, FolderOpen, 
  Calendar, FileText, Bell, Users, History, Settings, Shield, X 
} from "lucide-react";
import { UserProfile, translations } from "../types";

interface SidebarProps {
  user: UserProfile;
  language: 'en' | 'si';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  user,
  language,
  activeTab,
  setActiveTab,
  onLogout,
  isOpen = false,
  onClose
}: SidebarProps) {
  const t = translations[language];

  const menuItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard, roles: ["Super Admin", "Admin", "User"] },
    { id: "pending", label: t.pendingItems, icon: FileClock, roles: ["Super Admin", "Admin", "User"] },
    { id: "completed", label: t.completedItems, icon: CheckCircle2, roles: ["Super Admin", "Admin", "User"] },
    { id: "records", label: t.allRecords, icon: FolderOpen, roles: ["Super Admin", "Admin", "User"] },
    { id: "calendar", label: t.calendarView, icon: Calendar, roles: ["Super Admin", "Admin", "User"] },
    { id: "reports", label: t.reports, icon: FileText, roles: ["Super Admin", "Admin", "User"] },
    { id: "notifications", label: t.notifications, icon: Bell, roles: ["Super Admin", "Admin", "User"] },
    { id: "users", label: t.usersManagement, icon: Users, roles: ["Super Admin", "Admin"] },
    { id: "logs", label: t.activityLogs, icon: History, roles: ["Super Admin", "Admin"] },
    { id: "settings", label: t.settings, icon: Settings, roles: ["Super Admin", "Admin", "User"] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 dark:border-slate-800 dark:bg-slate-950 transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    }`}>
      
      {/* Sidebar Brand / Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-800 border border-amber-500/30">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-mono text-[9px] font-bold text-amber-500 tracking-wider uppercase">
              POLICE OFFICE
            </span>
            <span className="font-sans text-xs font-bold text-white tracking-tight leading-tight">
              SB CALL UP DIARY
            </span>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        {onClose && (
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
        {filteredMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              className={`flex w-full items-center space-x-3 rounded-lg px-3.5 py-3 font-sans text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-900 text-white shadow-xs border-l-4 border-amber-500 pl-2.5"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
              id={`sidebar-link-${item.id}`}
            >
              <IconComponent className={`h-4.5 w-4.5 ${isActive ? "text-amber-500" : "text-slate-400 group-hover:text-white"}`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
