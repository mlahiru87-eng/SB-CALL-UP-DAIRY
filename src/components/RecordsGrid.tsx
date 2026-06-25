import React, { useState, useEffect } from "react";
import { 
  Search, Filter, Calendar, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, FileText, Download, Trash2, Edit3, Eye, MoreHorizontal, MoreVertical 
} from "lucide-react";
import { CallUpEntry, UserProfile, translations } from "../types";
import { getEntries, deleteEntry, getAllUsers } from "../lib/db";

interface RecordsGridProps {
  user: UserProfile;
  language: 'en' | 'si';
  mode: 'pending' | 'completed' | 'all';
  onSelectEntry: (entry: CallUpEntry) => void;
  onEditEntry?: (entry: CallUpEntry) => void;
  refreshTrigger?: number;
}

export default function RecordsGrid({
  user,
  language,
  mode,
  onSelectEntry,
  onEditEntry,
  refreshTrigger = 0
}: RecordsGridProps) {
  const t = translations[language];
  const [entries, setEntries] = useState<CallUpEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState("All");

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (activeDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest(".records-dropdown-container")) {
          setActiveDropdownId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdownId]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await getEntries();
        const uList = await getAllUsers();
        setEntries(list);
        setUsers(uList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mode, refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this call up entry from the system permanently?")) {
      try {
        await deleteEntry(id);
        setEntries(prev => prev.filter(item => item.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  // 1. Initial Mode filtering
  let displayList = [...entries];
  if (mode === 'pending') {
    // Show entries that are NOT completed
    displayList = displayList.filter(e => !e.submissionReferenceNumber || e.submissionReferenceNumber.trim() === '');
  } else if (mode === 'completed') {
    // Show entries that are completed
    displayList = displayList.filter(e => e.status === 'Completed');
  }

  // 2. Query Search Filter (Search by Ref Number, Subject, Officer Name, Office, Submission Location)
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    displayList = displayList.filter(e => {
      const officerName = e.responsibleOfficerName || "";
      return (
        e.referenceNumber.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        officerName.toLowerCase().includes(q) ||
        e.officeInstitution.toLowerCase().includes(q) ||
        e.submissionLocation.toLowerCase().includes(q)
      );
    });
  }

  // 3. Priority Filter
  if (priorityFilter !== "All") {
    displayList = displayList.filter(e => e.priority === priorityFilter);
  }

  // 4. Status Filter (Only applicable for mode === 'all')
  if (mode === 'all' && statusFilter !== "All") {
    displayList = displayList.filter(e => e.status === statusFilter);
  }

  // 5. Officer Filter
  if (officerFilter !== "All") {
    displayList = displayList.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(officerFilter);
    });
  }

  // Excel CSV Export local simulation
  const handleExportCSV = () => {
    const headers = ["Record No", "Reference No", "Subject", "Office/Institution", "Due Date", "Officer Name", "Priority", "Status"];
    const rows = displayList.map(e => [
      e.recordNumber, e.referenceNumber, e.subject, e.officeInstitution, e.dueDate, e.responsibleOfficerName || e.responsibleOfficer, e.priority, e.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sb_journal_${mode}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            {mode === 'pending' ? <Clock className="h-5 w-5 text-indigo-900 dark:text-amber-500" /> :
             mode === 'completed' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
             <FileText className="h-5 w-5 text-indigo-900 dark:text-amber-500" />}
            <span>{mode === 'pending' ? t.pendingItems : mode === 'completed' ? t.completedItems : t.allRecords}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === 'pending' ? "Official correspondence with pending actions or approaching deadlines" :
             mode === 'completed' ? "Completed entries with submission record verifications" :
             "Master registry ledger containing all registered office incoming correspondence"}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 font-sans text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all mt-3 md:mt-0 cursor-pointer"
          id={`records-export-${mode}-btn`}
        >
          <Download className="h-4 w-4" />
          <span>{t.exportExcel}</span>
        </button>
      </div>

      {/* Advanced Filter Matrix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Search Input */}
        <div className="flex flex-col text-left">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Registry</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ref No, Subject, Officer..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col text-left">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 p-1.5 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        {/* Status Filter (Only if mode is 'all') */}
        {mode === 'all' ? (
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 p-1.5 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Officer Filter */}
        <div className="flex flex-col text-left">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Responsible Officer</label>
          <select
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
            className="rounded-lg border border-slate-200 p-1.5 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Officers</option>
            {users.map(u => (
              <option key={u.uid} value={u.uid}>{u.displayName}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Records Table Layout */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-24">{t.recordNumber}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-36">{t.refNumber}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Document Details</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-40">{t.dueDate}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-36">{t.responsibleOfficer}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-24">{t.priority}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-28">{t.status}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                displayList.map((entry) => {
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

                  // Completion details tooltip or tag if completed
                  const compText = entry.status === 'Completed' ? `SUB REF: ${entry.submissionReferenceNumber}` : null;

                  return (
                    <tr 
                      key={entry.id}
                      onClick={() => onSelectEntry(entry)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      {/* Record No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-900 dark:text-indigo-400 group-hover:underline">
                        {entry.recordNumber}
                      </td>

                      {/* Reference No */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {entry.referenceNumber}
                      </td>

                      {/* Subject & Institution */}
                      <td className="py-3.5 px-4 text-left max-w-sm md:max-w-md">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{entry.subject}</span>
                          <span className="font-sans text-[10px] text-slate-400 mt-0.5 truncate">{entry.officeInstitution} &bull; <span className="font-semibold text-indigo-600 dark:text-indigo-400">{entry.letterType}</span></span>
                        </div>
                      </td>

                      {/* Due Date & countdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{entry.dueDate}</span>
                          <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold mt-1 uppercase ${dateStyle}`}>
                            {dateLabel}
                          </span>
                        </div>
                      </td>

                      {/* Responsible Officer */}
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {entry.responsibleOfficerName || entry.responsibleOfficer}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityStyle}`}>
                          {entry.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          entry.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          entry.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {entry.status}
                        </span>
                        {compText && <span className="font-mono text-[8px] text-emerald-600 block mt-0.5">{compText}</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end records-dropdown-container" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === entry.id ? null : entry.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Actions"
                            id={`actions-toggle-${entry.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {activeDropdownId === entry.id && (
                            <div className="absolute right-4 mt-1.5 w-44 origin-top-right rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950 z-50 ring-1 ring-black/5 animate-in fade-in duration-100 text-left">
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  onSelectEntry(entry);
                                }}
                                className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                <span>{language === "si" ? "විස්තර පෙන්වන්න" : "Inspect Details"}</span>
                              </button>
                              
                              {user.role !== 'User' && onEditEntry && (
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    onEditEntry(entry);
                                  }}
                                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  id={`records-edit-${entry.id}`}
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{language === "si" ? "සංස්කරණය" : "Edit Entry"}</span>
                                </button>
                              )}

                              {user.role === 'Super Admin' && (
                                <button
                                  onClick={(e) => {
                                    setActiveDropdownId(null);
                                    handleDelete(entry.id, e);
                                  }}
                                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                                  id={`records-delete-${entry.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                  <span>{language === "si" ? "මකා දමන්න" : "Delete Record"}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
