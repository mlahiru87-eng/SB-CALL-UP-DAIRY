import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList 
} from "recharts";
import { 
  FileText, Users, FileClock, CheckCircle2, AlertTriangle, 
  Clock, Calendar, ArrowRight, ShieldAlert, Sparkles, TrendingUp
} from "lucide-react";
import { CallUpEntry, UserProfile, translations } from "../types";
import { getEntries, getAllUsers } from "../lib/db";

interface DashboardProps {
  user: UserProfile;
  language: 'en' | 'si';
  setActiveTab: (tab: string) => void;
  onSelectEntry: (entry: CallUpEntry) => void;
  onNewEntryClick?: () => void;
}

export default function Dashboard({
  user,
  language,
  setActiveTab,
  onSelectEntry,
  onNewEntryClick
}: DashboardProps) {
  const t = translations[language];
  const [entries, setEntries] = useState<CallUpEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const entryList = await getEntries();
        const userList = await getAllUsers();
        setEntries(entryList);
        setUsers(userList);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
          <span className="font-sans text-xs text-slate-500 font-semibold">Loading Dashboard Data...</span>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalRecords = entries.length;
  const totalUsers = users.length;
  const pendingItems = entries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;
  const completedItems = entries.filter(e => e.status === 'Completed').length;
  const overdueItems = entries.filter(e => e.status === 'Overdue').length;

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate Due Today
  const dueTodayCount = entries.filter(e => e.status !== 'Completed' && e.dueDate === todayStr).length;

  // Calculate Due This Week (Next 7 days from today)
  const today = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7);
  const oneWeekLaterStr = oneWeekLater.toISOString().split('T')[0];

  const dueThisWeekCount = entries.filter(e => {
    if (e.status === 'Completed') return false;
    return e.dueDate >= todayStr && e.dueDate <= oneWeekLaterStr;
  }).length;

  // Items due within 3 days / urgent pending items for attention list
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

  const attentionItems = entries.filter(e => {
    if (e.status === 'Completed') return false;
    const isOverdue = e.dueDate < todayStr;
    const isDueSoon = e.dueDate >= todayStr && e.dueDate <= threeDaysLaterStr;
    const isUrgent = e.priority === 'Urgent';
    return isOverdue || isDueSoon || isUrgent;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);

  // Chart 1: Status Distribution
  const statusChartData = [
    { name: t.pending, count: entries.filter(e => e.status === 'Pending').length, fill: '#3b82f6' },
    { name: t.inProgress, count: entries.filter(e => e.status === 'In Progress').length, fill: '#f59e0b' },
    { name: t.completed, count: entries.filter(e => e.status === 'Completed').length, fill: '#10b981' },
    { name: t.overdue, count: entries.filter(e => e.status === 'Overdue').length, fill: '#ef4444' }
  ];

  // Chart 2: Priority Breakdown
  const priorityChartData = [
    { name: t.low, value: entries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
    { name: t.medium, value: entries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
    { name: t.high, value: entries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
    { name: t.urgent, value: entries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
  ].filter(p => p.value > 0);

  // Statistics Card styling and content
  const statCards = [
    { id: "records", title: t.totalRecords, value: totalRecords, icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/30" },
    { id: "pending", title: t.pendingItems, value: pendingItems, icon: FileClock, color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/30" },
    { id: "completed", title: t.completedItems, value: completedItems, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30" },
    { id: "overdue", title: t.overdue, value: overdueItems, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/30" },
    { id: "dueToday", title: t.dueToday, value: dueTodayCount, icon: Clock, color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-950/30" },
    { id: "dueThisWeek", title: t.dueThisWeek, value: dueThisWeekCount, icon: Calendar, color: "text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-950/30" }
  ];

  if (user.role === "Super Admin") {
    statCards.push({
      id: "users",
      title: language === "si" ? "මුළු පරිශීලකයින්" : "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-teal-600 bg-teal-50 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-950/30"
    });
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:space-y-0 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="text-left">
          <div className="flex items-center space-x-2 text-indigo-900 dark:text-amber-500">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            <span className="font-sans text-xs font-bold uppercase tracking-wider">
              {t.govLabel}
            </span>
          </div>
          <h1 className="font-sans text-2xl font-black text-slate-900 dark:text-white mt-1">
            {t.welcomeBack}, {user.displayName}
          </h1>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.appSubTitle} &bull; Security Grade Dashboard &bull; {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'si-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Quick Actions */}
        {user.role !== 'User' && onNewEntryClick && (
          <button
            onClick={onNewEntryClick}
            className="flex items-center space-x-2 rounded-xl bg-indigo-900 px-5 py-3 font-sans text-xs font-bold text-white shadow-md hover:bg-indigo-950 hover:shadow-lg dark:bg-indigo-950 dark:hover:bg-slate-900 border border-amber-500/20 transition-all cursor-pointer"
            id="dashboard-new-entry-btn"
          >
            <span>+ {t.createEntry}</span>
          </button>
        )}
      </div>

      {/* Main Stats Cards Grid */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${user.role === 'Super Admin' ? '2xl:grid-cols-7 xl:grid-cols-4' : '2xl:grid-cols-6 xl:grid-cols-3'}`}>
        {statCards.map((card) => {
          const IconComp = card.icon;
          
          // Accessible style configurations for both light and dark modes
          const cardStyles: Record<string, { bg: string; border: string; title: string; number: string; iconColor: string }> = {
            records: {
              bg: "bg-[#E8F1FF] dark:bg-blue-950/40",
              border: "border-blue-200 dark:border-blue-900/50",
              title: "text-[#1E40AF] dark:text-blue-200",
              number: "text-[#1D4ED8] dark:text-blue-300",
              iconColor: "text-[#1E40AF] dark:text-blue-400"
            },
            pending: {
              bg: "bg-[#FFF7E6] dark:bg-amber-950/30",
              border: "border-amber-200 dark:border-amber-900/40",
              title: "text-[#B45309] dark:text-amber-200",
              number: "text-[#D97706] dark:text-amber-400",
              iconColor: "text-[#B45309] dark:text-amber-300"
            },
            completed: {
              bg: "bg-[#ECFDF5] dark:bg-emerald-950/30",
              border: "border-emerald-200 dark:border-emerald-900/40",
              title: "text-[#047857] dark:text-emerald-200",
              number: "text-[#059669] dark:text-emerald-400",
              iconColor: "text-[#047857] dark:text-emerald-300"
            },
            overdue: {
              bg: "bg-[#FEF2F2] dark:bg-red-950/30",
              border: "border-red-200 dark:border-red-900/40",
              title: "text-[#B91C1C] dark:text-red-200",
              number: "text-[#DC2626] dark:text-red-400",
              iconColor: "text-[#B91C1C] dark:text-red-300"
            },
            dueToday: {
              bg: "bg-[#EEF2FF] dark:bg-indigo-950/30",
              border: "border-indigo-200 dark:border-indigo-900/40",
              title: "text-[#4338CA] dark:text-indigo-200",
              number: "text-[#4F46E5] dark:text-indigo-400",
              iconColor: "text-[#4338CA] dark:text-indigo-300"
            },
            dueThisWeek: {
              bg: "bg-[#F3E8FF] dark:bg-purple-950/30",
              border: "border-purple-200 dark:border-purple-900/40",
              title: "text-[#7E22CE] dark:text-purple-200",
              number: "text-[#9333EA] dark:text-purple-400",
              iconColor: "text-[#7E22CE] dark:text-purple-300"
            },
            users: {
              bg: "bg-[#F0FDFA] dark:bg-teal-950/30",
              border: "border-teal-200 dark:border-teal-900/40",
              title: "text-[#0F766E] dark:text-teal-200",
              number: "text-[#0D9488] dark:text-teal-400",
              iconColor: "text-[#0F766E] dark:text-teal-300"
            }
          };

          const style = cardStyles[card.id] || cardStyles.records;

          return (
            <button
              key={card.id}
              onClick={() => {
                if (card.id === "pending") setActiveTab("pending");
                else if (card.id === "completed") setActiveTab("completed");
                else if (card.id === "records" || card.id === "dueToday" || card.id === "dueThisWeek") setActiveTab("records");
                else if (card.id === "overdue") setActiveTab("pending");
                else if (card.id === "users") setActiveTab("users");
              }}
              className={`flex flex-col items-center justify-center text-center rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer ${style.bg} ${style.border} shadow-xs min-h-[140px]`}
              id={`stat-card-${card.id}`}
            >
              {/* Card Title and Icon */}
              <div className="flex items-center justify-center space-x-2 w-full mb-2.5">
                <IconComp className={`h-4.5 w-4.5 shrink-0 ${style.iconColor}`} />
                <span className={`font-sans text-sm md:text-base font-semibold tracking-tight leading-tight truncate ${style.title}`}>
                  {card.title}
                </span>
              </div>
              
              {/* Large, High-Contrast Centered Metrics */}
              <span className={`font-sans text-[32px] sm:text-[36px] md:text-[38px] font-extrabold leading-none ${style.number}`}>
                {card.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Bar Chart: Document Status */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="text-left">
              <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Document Status Distribution
              </h3>
              <p className="font-sans text-[10px] text-slate-400">
                Active workflow breakdown across processing stages
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#475569', fontWeight: 600 }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#475569', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontFamily: 'Inter',
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    offset={8}
                    fill="#0f172a"
                    className="font-sans font-extrabold text-xs dark:fill-slate-200"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Priority Level Breakdown */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="text-left">
              <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Priority Distribution
              </h3>
              <p className="font-sans text-[10px] text-slate-400">
                Record load sorted by urgency level
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center mt-4 min-h-[220px]">
            {priorityChartData.length === 0 ? (
              <span className="font-sans text-xs text-slate-400">No priority data available</span>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Legend Indicators */}
            <div className="grid grid-cols-2 gap-2 w-full px-2 mt-2">
              {priorityChartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-left">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-sans text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Critical Items / Approaching Deadlines List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="text-left flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
            <div>
              <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Critical Documents & Impending Deadlines
              </h3>
              <p className="font-sans text-[10px] text-slate-400">
                Action required immediately for these overdue or urgent items
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("pending")} 
            className="flex items-center space-x-1 font-sans text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <span>{t.pendingItems}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {attentionItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No items requiring immediate attention. Excellent work!
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.recordNumber}</th>
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.subject}</th>
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.dueDate}</th>
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.responsibleOfficer}</th>
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.priority}</th>
                  <th className="py-2.5 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attentionItems.map((entry) => {
                  const isOverdue = entry.status === 'Overdue' || entry.dueDate < todayStr;
                  
                  // Calculate remaining days
                  const dueDateObj = new Date(entry.dueDate);
                  const todayObj = new Date(todayStr);
                  const diffTime = dueDateObj.getTime() - todayObj.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let dateLabel = "";
                  let dateStyle = "";
                  if (entry.status === 'Completed') {
                    dateLabel = t.completed;
                    dateStyle = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20";
                  } else if (isOverdue) {
                    const daysAgo = Math.abs(diffDays);
                    dateLabel = `${t.overdue} (${daysAgo} ${t.days})`;
                    dateStyle = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20";
                  } else if (diffDays === 0) {
                    dateLabel = t.today;
                    dateStyle = "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 font-bold";
                  } else if (diffDays <= 3) {
                    dateLabel = `${diffDays} ${t.daysLeft}`;
                    dateStyle = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 font-bold";
                  } else {
                    dateLabel = `${diffDays} ${t.daysLeft}`;
                    dateStyle = "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40";
                  }

                  let priorityStyle = "";
                  if (entry.priority === 'Urgent') priorityStyle = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold";
                  else if (entry.priority === 'High') priorityStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
                  else if (entry.priority === 'Medium') priorityStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                  else priorityStyle = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";

                  return (
                    <tr 
                      key={entry.id} 
                      onClick={() => onSelectEntry(entry)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-mono text-[11px] font-bold text-indigo-900 dark:text-indigo-400 group-hover:underline">
                        {entry.recordNumber}
                      </td>
                      <td className="py-3 max-w-xs md:max-w-md truncate font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                        {entry.subject}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-semibold ${dateStyle}`}>
                          {entry.dueDate} &bull; {dateLabel}
                        </span>
                      </td>
                      <td className="py-3 font-sans text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                        {entry.responsibleOfficerName || entry.responsibleOfficer}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${priorityStyle}`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          entry.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          entry.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
