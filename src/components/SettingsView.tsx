import React, { useState } from "react";
import { 
  Settings, Check, ShieldAlert, Loader2, Key, Eye, EyeOff, Lock 
} from "lucide-react";
import { translations, UserProfile } from "../types";
import { getIsDemoMode } from "../lib/db";
import { auth, isFirebaseEnabled } from "../lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

interface SettingsViewProps {
  user: UserProfile;
  language: 'en' | 'si';
}

const settingsTranslations = {
  en: {
    title: "Settings",
    subtitle: "Manage your system credentials and security parameters",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePasswordBtn: "Change Password",
    requiredField: "This field is required",
    passwordTooShort: "New Password must contain at least 8 characters",
    passwordsDoNotMatch: "Confirm Password must match New Password",
    successMsg: "Password successfully changed!",
    incorrectCurrentPassword: "The current password you entered is incorrect.",
    noUser: "No authenticated user found. Please re-authenticate.",
    demoNotice: "Running in Demo Mode. Your password change has been simulated locally.",
    processing: "Updating password...",
    placeholderCurrent: "Enter current password",
    placeholderNew: "Enter at least 8 characters",
    placeholderConfirm: "Repeat your new password"
  },
  si: {
    title: "සැකසුම්",
    subtitle: "ඔබගේ පද්ධති අක්තපත්‍ර සහ ආරක්ෂිත මුරපද සැකසුම් කළමනාකරණය කරන්න",
    changePassword: "මුරපදය වෙනස් කරන්න",
    currentPassword: "පවතින මුරපදය",
    newPassword: "නව මුරපදය",
    confirmNewPassword: "නව මුරපදය තහවුරු කරන්න",
    changePasswordBtn: "මුරපදය වෙනස් කරන්න",
    requiredField: "මෙම තීරුව පිරවීම අනිවාර්ය වේ",
    passwordTooShort: "නව මුරපදයට අවම වශයෙන් අක්ෂර 8 ක් ඇතුළත් විය යුතුය",
    passwordsDoNotMatch: "තහවුරු කළ මුරපදය නව මුරපදයට සමාන විය යුතුය",
    successMsg: "මුරපදය සාර්ථකව වෙනස් කරන ලදී!",
    incorrectCurrentPassword: "ඇතුළත් කළ පවතින මුරපදය වැරදි සහගතය.",
    noUser: "වලංගු පරිශීලකයෙකු හමු නොවීය. කරුණාකර නැවත ඇතුල් වන්න.",
    demoNotice: "පෙරහුරු මාදිලිය (Demo Mode) ක්‍රියාත්මකයි. මුරපදය වෙනස් කිරීම සාර්ථකව අනුකරණය කරන ලදී.",
    processing: "මුරපදය වෙනස් කරමින් පවතී...",
    placeholderCurrent: "පවතින මුරපදය ඇතුළත් කරන්න",
    placeholderNew: "අවම වශයෙන් අක්ෂර 8 ක් ඇතුළත් කරන්න",
    placeholderConfirm: "නව මුරපදය නැවත ඇතුළත් කරන්න"
  }
};

export default function SettingsView({
  user,
  language
}: SettingsViewProps) {
  const t = translations[language];
  const st = settingsTranslations[language];

  // Form Fields State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggles State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Validation State
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setErrors({});
    setError("");
    setSuccess("");
    
    // Validation
    let hasErrors = false;
    const newErrors: typeof errors = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = st.requiredField;
      hasErrors = true;
    }
    
    if (!newPassword) {
      newErrors.newPassword = st.requiredField;
      hasErrors = true;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = st.passwordTooShort;
      hasErrors = true;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = st.requiredField;
      hasErrors = true;
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = st.passwordsDoNotMatch;
      hasErrors = true;
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    const isDemo = getIsDemoMode();
    if (!isFirebaseEnabled || isDemo) {
      // Demo mode simulation
      setTimeout(() => {
        setLoading(false);
        setSuccess(`${st.successMsg} (${st.demoNotice})`);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1200);
    } else {
      // Live Firebase mode
      try {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          throw new Error(st.noUser);
        }
        
        // Re-authenticate
        const credential = EmailAuthProvider.credential(currentUser.email || "", currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, newPassword);
        
        setLoading(false);
        setSuccess(st.successMsg);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: any) {
        setLoading(false);
        console.error("Firebase Password change error:", err);
        
        // Check for incorrect credential / wrong password
        if (
          err.code === "auth/invalid-credential" || 
          err.code === "auth/wrong-password" || 
          err.message?.includes("wrong-password") || 
          err.message?.includes("invalid-credential")
        ) {
          setErrors({
            currentPassword: st.incorrectCurrentPassword
          });
          setError(st.incorrectCurrentPassword);
        } else {
          setError(err.message || "An unexpected error occurred. Please try again.");
        }
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-1">
      {/* Page Title & Subtitle */}
      <div className="text-left border-b border-slate-100 pb-3 dark:border-slate-800 mb-6">
        <h1 className="font-sans text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Settings className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
          <span>{st.title}</span>
        </h1>
        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {st.subtitle}
        </p>
      </div>

      {/* Global Success / Error Message Banners */}
      {success && (
        <div className="flex items-start space-x-2 rounded-xl bg-emerald-50/85 p-3.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 mb-5 animate-fade-in text-left">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div className="leading-relaxed">{success}</div>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 rounded-xl bg-red-50/85 p-3.5 text-xs font-semibold text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 mb-5 animate-fade-in text-left">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Main Form Card */}
      <form 
        onSubmit={handlePasswordChange} 
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800/80 dark:bg-slate-900 space-y-5 shadow-xs text-left"
      >
        <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <Lock className="h-4 w-4 text-indigo-900 dark:text-amber-500" />
          <span>{st.changePassword}</span>
        </h3>

        {/* Current Password Field */}
        <div className="flex flex-col space-y-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <span>{st.currentPassword}</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Key className="h-4 w-4" />
            </span>
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword) {
                  setErrors(prev => ({ ...prev, currentPassword: undefined }));
                }
              }}
              placeholder={st.placeholderCurrent}
              className={`w-full rounded-xl border pl-9 pr-10 py-2.5 font-sans text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden transition-colors ${
                errors.currentPassword 
                  ? "border-red-400 dark:border-red-500/70 focus:border-red-500" 
                  : "border-slate-200 focus:border-indigo-900 dark:border-slate-800 dark:focus:border-amber-500"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden"
              title={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="font-sans text-[11px] font-medium text-red-500 mt-1 pl-1">
              {errors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password Field */}
        <div className="flex flex-col space-y-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <span>{st.newPassword}</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) {
                  setErrors(prev => ({ ...prev, newPassword: undefined }));
                }
              }}
              placeholder={st.placeholderNew}
              className={`w-full rounded-xl border pl-9 pr-10 py-2.5 font-sans text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden transition-colors ${
                errors.newPassword 
                  ? "border-red-400 dark:border-red-500/70 focus:border-red-500" 
                  : "border-slate-200 focus:border-indigo-900 dark:border-slate-800 dark:focus:border-amber-500"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden"
              title={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="font-sans text-[11px] font-medium text-red-500 mt-1 pl-1">
              {errors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm New Password Field */}
        <div className="flex flex-col space-y-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <span>{st.confirmNewPassword}</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              placeholder={st.placeholderConfirm}
              className={`w-full rounded-xl border pl-9 pr-10 py-2.5 font-sans text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden transition-colors ${
                errors.confirmPassword 
                  ? "border-red-400 dark:border-red-500/70 focus:border-red-500" 
                  : "border-slate-200 focus:border-indigo-900 dark:border-slate-800 dark:focus:border-amber-500"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="font-sans text-[11px] font-medium text-red-500 mt-1 pl-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Large Primary Change Password Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 px-5 py-3 font-sans text-sm font-bold text-white shadow-md dark:bg-indigo-950 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer h-12"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{st.processing}</span>
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                <span>{st.changePasswordBtn}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
