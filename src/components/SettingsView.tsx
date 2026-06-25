import React, { useState, useEffect } from "react";
import { 
  Settings, Save, Check, ShieldAlert, Building, 
  Bell, HelpCircle, Loader2, RefreshCw 
} from "lucide-react";
import { SystemSettings, translations, UserProfile } from "../types";
import { getSystemSettings, saveSystemSettings, getIsDemoMode, setIsDemoMode } from "../lib/db";

interface SettingsViewProps {
  user: UserProfile;
  language: 'en' | 'si';
}

export default function SettingsView({
  user,
  language
}: SettingsViewProps) {
  const t = translations[language];
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [warningDays, setWarningDays] = useState(3);
  
  // Sandbox environment details
  const [isDemo, setIsDemo] = useState(getIsDemoMode());

  const canEdit = user.role === 'Super Admin' || user.role === 'Admin';

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getSystemSettings();
        setSettings(s);
        setOrgName(s.organizationName);
        setOrgLogo(s.organizationLogo);
        setEmailNotif(s.emailNotifications);
        setWarningDays(s.reminderDaysBefore);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setError("");
    setSuccess("");
    setSaving(true);

    if (!orgName.trim()) {
      setSaving(false);
      return setError("Organization Name is required.");
    }

    try {
      const updated: SystemSettings = {
        organizationName: orgName.trim(),
        organizationLogo: orgLogo.trim(),
        emailNotifications: emailNotif,
        reminderDaysBefore: warningDays
      };
      await saveSystemSettings(updated);
      setSuccess(t.saveSettingsSuccess);
    } catch (err: any) {
      setError(err.message || "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleDemoToggle = (checked: boolean) => {
    setIsDemoMode(checked);
    setIsDemo(checked);
    setSuccess("Database mode swapped! Page reload recommended to flush state cache.");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Page Title */}
      <div className="text-left border-b border-slate-100 pb-3 dark:border-slate-800">
        <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Settings className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
          <span>{t.settings}</span>
        </h1>
        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Configure security threshold metrics, warning schedules, and system database parameters
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="flex items-center space-x-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Left main form cards */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4 shadow-xs text-left">
            <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building className="h-4.5 w-4.5 text-indigo-900 dark:text-amber-500" />
              <span>Office Identification</span>
            </h3>

            {/* Org Name */}
            <div className="flex flex-col">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t.organizationName} *
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!canEdit}
                placeholder="e.g. Special Branch Head Office - Sri Lanka Police"
                className="rounded-lg border border-slate-200 p-2.5 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                required
              />
            </div>

            {/* Org Logo URL */}
            <div className="flex flex-col">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t.organizationLogo} (Asset link / Base64)
              </label>
              <input
                type="text"
                value={orgLogo}
                onChange={(e) => setOrgLogo(e.target.value)}
                disabled={!canEdit}
                placeholder="https://example.com/logo.png"
                className="rounded-lg border border-slate-200 p-2.5 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Bell className="h-4.5 w-4.5 text-indigo-900 dark:text-amber-500" />
              <span>Warning & Reminder Thresholds</span>
            </h3>

            {/* Email warning check */}
            <div className="flex items-center justify-between py-1">
              <div className="text-left">
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">{t.emailNotificationsToggle}</p>
                <p className="font-sans text-[10px] text-slate-400">Dispatch system updates of approaching deadlines to officers</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                disabled={!canEdit}
                className="h-4 w-4 text-indigo-900 border-slate-300 rounded-md focus:ring-indigo-900"
              />
            </div>

            {/* Threshold count days */}
            <div className="flex flex-col">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                <span>{t.reminderDaysConfig}</span>
                <HelpCircle className="h-3 w-3 text-slate-400" title="Flag entries as Orange Warning inside pending queue" />
              </label>
              <input
                type="number"
                value={warningDays}
                onChange={(e) => setWarningDays(parseInt(e.target.value, 10))}
                disabled={!canEdit}
                min={1}
                max={14}
                className="w-32 rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                required
              />
            </div>

            {/* Save Buttons */}
            {canEdit && (
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 px-5 py-2 font-sans text-xs font-bold text-white shadow-xs dark:bg-indigo-950 dark:hover:bg-slate-900 disabled:opacity-50 transition-all cursor-pointer"
                  id="settings-save-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{t.save}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Sandbox/Firebase status Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs text-left">
            <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
              <RefreshCw className="h-4.5 w-4.5 text-indigo-900" />
              <span>Data Engine Toggle</span>
            </h3>
            
            <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-3">
              {t.demoMode}
            </p>
            <p className="font-sans text-[10px] leading-relaxed text-slate-400 mt-1">
              {t.demoModeDesc}
            </p>

            <div className="flex items-center justify-between mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50">
              <span className="font-sans text-[10px] font-bold text-slate-500 uppercase">Demo State Active</span>
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => handleDemoToggle(e.target.checked)}
                className="h-4 w-4 text-indigo-900 border-slate-300 rounded-md focus:ring-indigo-900 cursor-pointer"
              />
            </div>
            
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-2 block text-center">
              * Toggling triggers instant secure directory swap
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
