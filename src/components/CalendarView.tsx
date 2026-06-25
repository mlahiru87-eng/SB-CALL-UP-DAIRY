import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, CheckCircle, AlertTriangle, ArrowRight 
} from "lucide-react";
import { CallUpEntry, translations } from "../types";
import { getEntries } from "../lib/db";

interface CalendarViewProps {
  language: 'en' | 'si';
  onSelectEntry: (entry: CallUpEntry) => void;
}

export default function CalendarView({
  language,
  onSelectEntry
}: CalendarViewProps) {
  const t = translations[language];
  const [entries, setEntries] = useState<CallUpEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)); // Start with June 2026 based on current date
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      try {
        const list = await getEntries();
        setEntries(list);
      } catch (err) {
        console.error(err);
      }
    }
    loadEntries();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const calendarDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Add previous month filler days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    calendarDays.push({ day: i, isCurrentMonth: true, dateStr });
  }

  // Add next month filler days to complete grid
  const totalDays = 42; // 6 rows * 7 columns
  const remainingDays = totalDays - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    calendarDays.push({ day: i, isCurrentMonth: false, dateStr });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get entries due on a specific date
  const getEntriesForDate = (dateStr: string) => {
    return entries.filter(e => e.dueDate === dateStr);
  };

  const selectedDateEntries = selectedDateStr ? getEntriesForDate(selectedDateStr) : [];

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="text-left border-b border-slate-100 pb-3 dark:border-slate-800">
        <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
          <span>{t.calendarView}</span>
        </h1>
        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Track official deadliness, submissions, and overdue letters on the monthly master schedule
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Calendar Grid Container */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 transition-colors">
          
          {/* Month Navigator Header */}
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-sans text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 uppercase tracking-wider"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2 dark:border-slate-800">
            {daysOfWeek.map((day) => (
              <span key={day} className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {calendarDays.map((item, idx) => {
              const dateEntries = getEntriesForDate(item.dateStr);
              const isSelected = selectedDateStr === item.dateStr;
              
              // Status counts
              const hasOverdue = dateEntries.some(e => e.status === 'Overdue');
              const hasCompleted = dateEntries.some(e => e.status === 'Completed');
              const hasPending = dateEntries.some(e => e.status === 'Pending' || e.status === 'In Progress');

              let cellStyle = "bg-slate-50/50 hover:bg-indigo-50/25 dark:bg-slate-950/20 dark:hover:bg-indigo-950/10";
              if (!item.isCurrentMonth) {
                cellStyle = "bg-white/40 text-slate-300 dark:text-slate-700 hover:bg-slate-50/20";
              }
              if (isSelected) {
                cellStyle = "ring-2 ring-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 dark:ring-amber-500";
              }

              // Today highlight
              const isToday = item.dateStr === new Date().toISOString().split('T')[0];
              const todayStyle = isToday ? "text-indigo-900 border border-indigo-950 font-bold dark:border-amber-500 dark:text-amber-500" : "text-slate-800 dark:text-slate-300";

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`min-h-[72px] rounded-xl border border-slate-100 p-1.5 flex flex-col justify-between text-left transition-all dark:border-slate-800/40 ${cellStyle}`}
                >
                  {/* Day Number */}
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold ${todayStyle}`}>
                    {item.day}
                  </span>

                  {/* Indicator Dots / Mini Tags */}
                  <div className="space-y-1 w-full mt-1.5">
                    {dateEntries.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full">
                        {/* Compact tag summary if entries exist */}
                        {hasOverdue && (
                          <span className="h-1 w-full rounded-xs bg-red-600 block" title="Overdue Items Due" />
                        )}
                        {hasPending && (
                          <span className="h-1 w-full rounded-xs bg-indigo-500 block" title="Pending Items Due" />
                        )}
                        {hasCompleted && (
                          <span className="h-1 w-full rounded-xs bg-emerald-500 block" title="Completed Items Due" />
                        )}
                        
                        {/* Item counter */}
                        <span className="font-mono text-[8px] font-bold text-slate-400 mt-0.5 block text-center">
                          {dateEntries.length} {dateEntries.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Date Drawer/Side List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 transition-colors flex flex-col min-h-[400px]">
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800 text-left">
            <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Selected Date Summary
            </h3>
            <p className="font-sans text-xs font-bold text-indigo-700 dark:text-amber-500 mt-1">
              {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'si-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a calendar date"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3">
            {!selectedDateStr ? (
              <div className="flex h-64 items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
                Click any calendar date cell to display pending and completed entries.
              </div>
            ) : selectedDateEntries.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 p-4">
                No letter actions or tasks are scheduled or due on this date.
              </div>
            ) : (
              selectedDateEntries.map((entry) => {
                let statusIcon = <Clock className="h-4 w-4 text-indigo-500" />;
                let borderCol = "border-indigo-100 hover:border-indigo-300 dark:border-indigo-950/30";
                
                if (entry.status === 'Overdue') {
                  statusIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
                  borderCol = "border-red-100 hover:border-red-300 dark:border-red-950/30";
                } else if (entry.status === 'Completed') {
                  statusIcon = <CheckCircle className="h-4 w-4 text-emerald-500" />;
                  borderCol = "border-emerald-100 hover:border-emerald-300 dark:border-emerald-950/30";
                }

                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`w-full rounded-xl border p-3.5 text-left flex items-start space-x-3 transition-all hover:scale-[1.01] bg-slate-50/40 dark:bg-slate-950/20 ${borderCol}`}
                  >
                    <div className="mt-0.5">{statusIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-slate-400">{entry.recordNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                          entry.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                          entry.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                          entry.priority === 'Medium' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>{entry.priority}</span>
                      </div>
                      <h4 className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                        {entry.subject}
                      </h4>
                      <p className="font-sans text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Officer: {entry.responsibleOfficerName || entry.responsibleOfficer}
                      </p>
                      <div className="flex items-center space-x-1 font-sans text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400 mt-2.5">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
