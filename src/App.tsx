import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import EntryForm from "./components/EntryForm";
import EntryDetails from "./components/EntryDetails";
import CalendarView from "./components/CalendarView";
import Reports from "./components/Reports";
import UserManagement from "./components/UserManagement";
import ActivityLogs from "./components/ActivityLogs";
import SettingsView from "./components/SettingsView";
import RecordsGrid from "./components/RecordsGrid";
import NotificationsCenter from "./components/NotificationsCenter";
import Login from "./components/Login";

import { CallUpEntry, UserProfile, translations } from "./types";
import { 
  getSessionUser, signOutUser, createEntry, updateEntry, completeEntry, 
  getNotifications, getIsDemoMode
} from "./lib/db";
import { auth, isFirebaseEnabled } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filterPreset, setFilterPreset] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'dueToday' | 'dueThisWeek'>('all');

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setFilterPreset('all');
  };
  
  // Registry selection and modal controls
  const [selectedEntry, setSelectedEntry] = useState<CallUpEntry | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CallUpEntry | null>(null);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check login session on mount
  useEffect(() => {
    const isDemo = getIsDemoMode();
    if (!isFirebaseEnabled || isDemo) {
      // In demo mode or if Firebase is disabled, load synchronously from local storage
      const activeUser = getSessionUser();
      if (activeUser) {
        setUser(activeUser);
      }
      setLoadingAuth(false);
    } else {
      // In live Firebase mode, listen for auth state changes to synchronize
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const activeUser = getSessionUser();
          if (activeUser && activeUser.uid === firebaseUser.uid) {
            setUser(activeUser);
          } else {
            // If local storage is empty/out of sync but Firebase Auth is logged in, restore profile
            try {
              const { doc, getDoc } = await import("firebase/firestore");
              const { db } = await import("./lib/firebase");
              const userDoc = await getDoc(doc(db!, "users", firebaseUser.uid));
              if (userDoc.exists()) {
                const profile = { ...userDoc.data(), uid: firebaseUser.uid } as UserProfile;
                setUser(profile);
                localStorage.setItem("sb_diary_active_user", JSON.stringify(profile));
              } else {
                setUser(null);
              }
            } catch (err) {
              console.error("Error restoring user profile from Firestore:", err);
              setUser(null);
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem("sb_diary_active_user");
        }
        setLoadingAuth(false);
      });
      return () => unsubscribe();
    }
  }, []);

  // Load background CPM network scripts
  useEffect(() => {
    // Check if running in iframe (AI Studio preview) to bypass aggressive scripts that trigger SecurityError
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }

    if (inIframe) {
      console.log("Bypassing external ad scripts inside sandboxed preview environment.");
      return;
    }

    const scripts = [
      "https://pl30126735.effectivecpmnetwork.com/c7/6b/66/c76b66b9af2465dd0d7a7e49f9979e1c.js",
      "https://pl30133386.effectivecpmnetwork.com/15/16/48/151648297d1956a0fd3a877731c8bb68.js"
    ];
    
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        s.async = true;
        document.body.appendChild(s);
      }
    });
  }, []);

  // Sync theme to root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    setSelectedEntry(null);
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleOpenCreateForm = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleOpenEditForm = (entry: CallUpEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleFormSave = async (entryData: any) => {
    try {
      if (editingEntry) {
        const updated = await updateEntry({ ...editingEntry, ...entryData });
        setShowEntryForm(false);
        setEditingEntry(null);
        setRefreshTrigger(prev => prev + 1);
        if (selectedEntry && selectedEntry.id === updated.id) {
          setSelectedEntry(updated);
        }
      } else {
        await createEntry(entryData);
        setShowEntryForm(false);
        setEditingEntry(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSelectRecord = (record: CallUpEntry) => {
    setSelectedEntry(record);
  };

  if (loadingAuth) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
          <p className="text-sm font-mono tracking-wide opacity-75">Establishing secure link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col transition-colors`}>
      
      {!user ? (
        /* Portal Login screen wrapper */
        <Login 
          language={language}
          setLanguage={setLanguage}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        /* Authorized System Shell */
        <div className="flex-1 flex flex-col md:flex-row relative">
          
          {/* Left Navigation Sidebar */}
          <Sidebar 
            user={user}
            language={language}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Mobile Sidebar Backdrop overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Right Main Panel Body content */}
          <div className="flex-1 flex flex-col min-w-0 md:pl-64">
            
            {/* Top Navigation Header */}
            <Header 
              user={user}
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onNavigateToNotifications={() => handleSetActiveTab('notifications')}
              setActiveTab={handleSetActiveTab}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Inner scroll viewport container */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 print:p-0 print:overflow-visible">
              
              {/* Dynamic render tab panels based on sidebar states */}
              {activeTab === 'dashboard' && (
                <Dashboard 
                  user={user}
                  language={language}
                  setActiveTab={setActiveTab}
                  setFilterPreset={setFilterPreset}
                  onSelectEntry={handleSelectRecord}
                  onNewEntryClick={handleOpenCreateForm}
                />
              )}

              {activeTab === 'pending' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="pending"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                />
              )}

              {activeTab === 'completed' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="completed"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                />
              )}

              {activeTab === 'records' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="all"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView 
                  language={language}
                  onSelectEntry={handleSelectRecord}
                />
              )}

              {activeTab === 'reports' && (
                <Reports 
                  language={language}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsCenter 
                  user={user}
                  language={language}
                />
              )}

              {activeTab === 'users' && (
                <UserManagement 
                  language={language}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                />
              )}

              {activeTab === 'logs' && (
                <ActivityLogs 
                  language={language}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  user={user}
                  language={language}
                />
              )}

            </main>

          </div>

        </div>
      )}

      {/* OVERLAY: Create & Edit Form Modal */}
      {showEntryForm && (
        <EntryForm 
          language={language}
          entry={editingEntry || undefined}
          onSave={handleFormSave}
          onClose={() => { setShowEntryForm(false); setEditingEntry(null); }}
        />
      )}

      {/* OVERLAY: Inspect Entry details and completion modal */}
      {selectedEntry && (
        <EntryDetails 
          user={user!}
          language={language}
          entry={selectedEntry}
          onComplete={async (id, data) => {
            await completeEntry(id, data);
            setSelectedEntry(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          onClose={() => setSelectedEntry(null)}
        />
      )}

    </div>
  );
}
