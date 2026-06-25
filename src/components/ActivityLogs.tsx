import { useState, useEffect } from "react";
import { 
  History, Search, ShieldAlert, Check, RefreshCw, 
  Trash2, PlusCircle, CheckCircle, LogIn, Lock 
} from "lucide-react";
import { ActivityLog, translations } from "../types";
import { getActivityLogs } from "../lib/db";

interface ActivityLogsProps {
  language: 'en' | 'si';
}

export default function ActivityLogs({
  language
}: ActivityLogsProps) {
  const t = translations[language];
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await getActivityLogs();
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("login")) return <LogIn className="h-4 w-4 text-emerald-600" />;
    if (actionLower.includes("create")) return <PlusCircle className="h-4 w-4 text-blue-600" />;
    if (actionLower.includes("complete")) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (actionLower.includes("delete")) return <Trash2 className="h-4 w-4 text-red-600" />;
    if (actionLower.includes("update")) return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-reverse" />;
    return <History className="h-4 w-4 text-slate-500" />;
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      log.userName.toLowerCase().includes(q) ||
      log.userEmail.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );

    const matchesAction = actionFilter === "All" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Get unique actions for filter dropdown
  const uniqueActions = ["All", ...Array.from(new Set(logs.map(l => l.action)))];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <History className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
            <span>{t.activityLogs}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographic ledger tracking user actions, portal logins, and journal record deletions
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
          title="Refresh logs"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Query Search Panel */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl print:hidden">
        <div className="relative flex-1 text-left">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by officer email, description, details..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col text-left w-48 shrink-0">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act === "All" ? "All Actions" : act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Log Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-12 text-center">Type</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-40">Action Target</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Log Description</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">User Identity</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No matching activity logs registered.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let actionColor = "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300";
                  const act = log.action.toLowerCase();
                  if (act.includes("create")) actionColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300";
                  else if (act.includes("complete") || act.includes("login")) actionColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300";
                  else if (act.includes("delete")) actionColor = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300";
                  else if (act.includes("update")) actionColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      
                      {/* Icon */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950">
                          {getActionIcon(log.action)}
                        </div>
                      </td>

                      {/* Action Target Category */}
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Log Description */}
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-left leading-relaxed">
                        {log.details}
                      </td>

                      {/* User identity */}
                      <td className="py-3 px-4 text-left">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{log.userName}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{log.userEmail} &bull; <span className="uppercase text-indigo-600 dark:text-indigo-400 font-semibold">{log.userRole}</span></p>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
