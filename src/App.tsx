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
  getNotifications 
} from "./lib/db";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Registry selection and modal controls
  const [selectedEntry, setSelectedEntry] = useState<CallUpEntry | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CallUpEntry | null>(null);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check login session on mount
  useEffect(() => {
    const activeUser = getSessionUser();
    if (activeUser) {
      setUser(activeUser);
    }
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
            setActiveTab={setActiveTab}
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
              onNavigateToNotifications={() => setActiveTab('notifications')}
              setActiveTab={setActiveTab}
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
                  onSelectEntry={handleSelectRecord}
                  onNewEntryClick={handleOpenCreateForm}
                />
              )}

              {activeTab === 'pending' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="pending"
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === 'completed' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="completed"
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === 'records' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="all"
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
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
