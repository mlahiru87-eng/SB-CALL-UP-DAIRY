import { useState, useEffect, useRef } from "react";
import { 
  FileText, Download, Printer, Filter, Calendar, 
  ArrowRight, Search, TrendingUp, CheckCircle, AlertTriangle, Users 
} from "lucide-react";
import { CallUpEntry, UserProfile, translations } from "../types";
import { getEntries, getAllUsers } from "../lib/db";

interface ReportsProps {
  language: 'en' | 'si';
}

type ReportType = 'pending' | 'completed' | 'overdue' | 'monthly' | 'performance';

export default function Reports({
  language
}: ReportsProps) {
  const t = translations[language];
  const [entries, setEntries] = useState<CallUpEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('pending');
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const entryList = await getEntries();
        const userList = await getAllUsers();
        setEntries(entryList);
        setUsers(userList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  // Filter logic
  let filteredEntries = [...entries];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Report Type filtering
  if (reportType === 'pending') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress');
  } else if (reportType === 'completed') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Completed');
  } else if (reportType === 'overdue') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Overdue' || (e.status !== 'Completed' && e.dueDate < todayStr));
  }

  // 2. Extra Filters
  if (priorityFilter !== "All") {
    filteredEntries = filteredEntries.filter(e => e.priority === priorityFilter);
  }
  if (officerFilter !== "All") {
    filteredEntries = filteredEntries.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(officerFilter);
    });
  }
  if (dateFrom) {
    filteredEntries = filteredEntries.filter(e => e.dateReceived >= dateFrom);
  }
  if (dateTo) {
    filteredEntries = filteredEntries.filter(e => e.dueDate <= dateTo);
  }

  // Calculate stats for Performance report
  const performanceData = users.map(u => {
    const assigned = entries.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(u.uid);
    });
    const completed = assigned.filter(e => e.status === 'Completed').length;
    const overdue = assigned.filter(e => e.status === 'Overdue').length;
    const pending = assigned.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;
    
    // Completion rate %
    const rate = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 0;
    
    return {
      uid: u.uid,
      name: u.displayName,
      designation: u.designation || "Officer",
      department: u.department || "General",
      total: assigned.length,
      completed,
      overdue,
      pending,
      rate
    };
  });

  // Calculate monthly aggregates
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = months.map((m, idx) => {
    const monthEntries = entries.filter(e => {
      const parts = e.dateReceived.split('-');
      if (parts.length < 2) return false;
      const monthNum = parseInt(parts[1], 10) - 1;
      return monthNum === idx && parts[0] === '2026';
    });
    
    return {
      name: m,
      total: monthEntries.length,
      completed: monthEntries.filter(e => e.status === 'Completed').length,
      pending: monthEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length,
      overdue: monthEntries.filter(e => e.status === 'Overdue').length
    };
  }).filter(m => m.total > 0);

  // Download simulation as Excel (CSV format)
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'performance') {
      headers = ["Officer Name", "Designation", "Department", "Total Assigned", "Completed", "Pending", "Overdue", "Completion Rate (%)"];
      rows = performanceData.map(p => [
        p.name, p.designation, p.department, p.total.toString(), 
        p.completed.toString(), p.pending.toString(), p.overdue.toString(), `${p.rate}%`
      ]);
    } else {
      headers = ["Record Number", "Reference Number", "Subject", "Classification", "Office/Institution", "Received Date", "Due Date", "Officer Name", "Priority", "Status"];
      rows = filteredEntries.map(e => [
        e.recordNumber, e.referenceNumber, e.subject, e.letterType, e.officeInstitution,
        e.dateReceived, e.dueDate, e.responsibleOfficerName || e.responsibleOfficer, e.priority, e.status
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sb_call_up_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger window printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-8 print:bg-white print:text-black">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 dark:border-slate-800 print:hidden">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
            <span>{t.reports}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Audit documents, export registry tables, and monitor user resolution timelines
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2.5 mt-3 md:mt-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 font-sans text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
            id="reports-export-excel-btn"
          >
            <Download className="h-4 w-4" />
            <span>{t.exportExcel}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 px-4.5 py-2 font-sans text-xs font-bold text-white shadow-sm dark:bg-indigo-950 dark:hover:bg-slate-900 transition-all cursor-pointer"
            id="reports-print-btn"
          >
            <Printer className="h-4 w-4" />
            <span>{t.printFriendly}</span>
          </button>
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 p-1 bg-slate-50 rounded-xl dark:border-slate-800 dark:bg-slate-950/60 print:hidden">
        {[
          { id: 'pending', label: t.pendingReport, icon: FileText },
          { id: 'completed', label: t.completedReport, icon: CheckCircle },
          { id: 'overdue', label: t.overdueReport, icon: AlertTriangle },
          { id: 'monthly', label: t.monthlyReport, icon: TrendingUp },
          { id: 'performance', label: t.userPerformanceReport, icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-indigo-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400"
              }`}
              id={`report-tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Matrix (Not displayed for monthly report) */}
      {reportType !== 'monthly' && reportType !== 'performance' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 print:hidden">
          {/* Priority */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Responsible Officer */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Officer</label>
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All Officers</option>
              {users.map(u => (
                <option key={u.uid} value={u.uid}>{u.displayName}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date Received From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Due Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* Printable Report Output Area */}
      <div 
        ref={printAreaRef}
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs print:border-none print:shadow-none print:p-0 transition-colors"
      >
        {/* Printable Header Info */}
        <div className="text-center pb-6 border-b border-double border-slate-300 dark:border-slate-800">
          <span className="font-sans text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
            {t.govLabel}
          </span>
          <h2 className="font-sans text-lg font-black text-slate-900 dark:text-white mt-1 uppercase tracking-wider">
            {t.appTitle} Registry Database
          </h2>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
            Official {reportType} Status Audit Report &bull; Confirmed Integrity
          </p>
          <div className="flex justify-center items-center space-x-6 text-[10px] text-slate-400 font-mono mt-3">
            <span>Date Generated: {new Date().toLocaleDateString()}</span>
            <span>Target Country: Sri Lanka</span>
            <span>Classification: Restricted Office Data</span>
          </div>
        </div>

        {/* Dynamic Report Table View */}
        <div className="mt-6 overflow-x-auto">
          {reportType === 'monthly' ? (
            /* Monthly Summary Report */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Month Cycle (2026)</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Received</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Completed Actions</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Overdue Actions</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Resolution Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyData.map((m, idx) => {
                  const rate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{m.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{m.total}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{m.completed}</td>
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{m.overdue}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 uppercase">
                          {rate}% Complete
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : reportType === 'performance' ? (
            /* User Performance Report */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Officer Name</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Designation / Department</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Assigned</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Completed</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Pending</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Overdue</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Performance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {performanceData.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div className="font-semibold">{p.designation}</div>
                      <div className="text-[10px] font-mono opacity-80">{p.department}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{p.total}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{p.completed}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{p.pending}</td>
                    <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{p.overdue}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                          <div className="bg-emerald-500 h-full" style={{ width: `${p.rate}%` }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">{p.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Documents List Reports (Pending, Completed, Overdue) */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.recordNumber}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.refNumber}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.subject}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.officeInstitution}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.dueDate}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.responsibleOfficer}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.priority}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No matching records are registered in the journal.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900 dark:text-indigo-400">{entry.recordNumber}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{entry.referenceNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">{entry.subject}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">{entry.officeInstitution}</td>
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{entry.dueDate}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">{entry.responsibleOfficerName || entry.responsibleOfficer}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          entry.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          entry.priority === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          entry.priority === 'Medium' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-300">
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Signature Box at print time */}
        <div className="hidden print:flex justify-between items-center mt-12 pt-12 border-t border-slate-200">
          <div className="text-left">
            <div className="border-b border-black w-48 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2 block">Officer-in-Charge Signature</span>
          </div>
          <div className="text-right">
            <div className="border-b border-black w-48 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2 block">Authorized Registrar seal</span>
          </div>
        </div>

      </div>

    </div>
  );
}
