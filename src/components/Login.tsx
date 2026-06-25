import React, { useState } from "react";
import { 
  Lock, Mail, Shield, AlertTriangle, Key, ArrowRight, Check, Loader2, Sparkles, Globe 
} from "lucide-react";
import { translations } from "../types";
import { signInUser, signUpUser, forgotPassword, getIsDemoMode, setIsDemoMode } from "../lib/db";

interface LoginProps {
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  onLoginSuccess: (user: any) => void;
}

export default function Login({
  language,
  setLanguage,
  onLoginSuccess
}: LoginProps) {
  const t = translations[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isDemo, setIsDemo] = useState(getIsDemoMode());
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email.trim() || !password.trim()) {
      return setError("Email and password fields cannot be empty.");
    }

    setLoading(true);
    try {
      const userProfile = await signInUser(email.trim(), password);
      onLoginSuccess(userProfile);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      return setError("All fields with asterisk (*) are required.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      const userProfile = await signUpUser(
        email.trim(), 
        password, 
        displayName.trim(), 
        designation.trim(), 
        department.trim()
      );
      setSuccess("Account successfully created and logged in!");
      setTimeout(() => {
        onLoginSuccess(userProfile);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotEmail.trim()) return setError("Please supply a registered email address.");

    setLoading(true);
    try {
      const msg = await forgotPassword(forgotEmail.trim());
      setSuccess(msg);
      setTimeout(() => setShowForgot(false), 3000);
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  const handleDemoModeToggle = (checked: boolean) => {
    setIsDemoMode(checked);
    setIsDemo(checked);
    setError("");
    setSuccess(`Data Mode: Swapped to ${checked ? 'Demo State' : 'Live Firebase'}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden transition-colors">
      
      {/* Decorative ambient lighting elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      {/* Main Container Cards */}
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[550px]">
        
        {/* Left column info branding (hidden on small mobile) */}
        <div className="md:col-span-5 bg-slate-950 p-8 flex flex-col justify-between text-left relative border-r border-slate-800">
          
          {/* Language badge inside brand column */}
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/40 border border-amber-500/20">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            
            {/* Language toggle inside login */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/50 p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`rounded px-2.5 py-0.5 text-[10px] font-bold ${language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("si")}
                className={`rounded px-2.5 py-0.5 text-[10px] font-bold ${language === 'si' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                සිං
              </button>
            </div>
          </div>

          <div className="space-y-3.5 mt-8 md:mt-0">
            <span className="font-mono text-[9px] font-bold text-amber-500 tracking-widest uppercase">
              {t.govLabel}
            </span>
            <h1 className="font-sans text-2xl font-black text-white uppercase tracking-tight leading-none">
              {t.appTitle}
            </h1>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              {t.appSubTitle} &bull; Security Journal & Tracking Center
            </p>
          </div>

          <div className="mt-8 md:mt-0 border-t border-slate-800/80 pt-4">
            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">System Mode Toggle</span>
            <div className="flex items-center justify-between rounded-xl bg-slate-900/40 border border-slate-850 p-3">
              <div className="text-left pr-2">
                <span className="font-sans text-xs font-bold text-slate-300 block">{t.demoMode}</span>
                <span className="font-sans text-[9px] text-slate-500">Run client-side local database</span>
              </div>
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => handleDemoModeToggle(e.target.checked)}
                className="h-4.5 w-4.5 text-indigo-900 border-slate-800 rounded-md cursor-pointer focus:ring-indigo-900"
              />
            </div>
          </div>

        </div>

        {/* Right column Form controller */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-950/20 p-3.5 text-xs font-semibold text-red-400 border border-red-950/40 mb-4 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 rounded-lg bg-emerald-950/20 p-3.5 text-xs font-semibold text-emerald-400 border border-emerald-950/40 mb-4 text-left">
              <Check className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!showForgot ? (
            isSignUp ? (
              /* SIGN UP SCREEN */
              <form onSubmit={handleSignUpSubmit} className="space-y-3">
                <div className="text-left mb-4">
                  <h2 className="font-sans text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                    <span>{t.signUp}</span>
                  </h2>
                  <p className="font-sans text-xs text-slate-500 mt-1">
                    Register a new credentials identity inside the SB Journal System
                  </p>
                </div>

                {/* Display Name */}
                <div className="flex flex-col text-left">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.displayName} *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Inspector Nimal Senanayake"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col text-left">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.email} *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@sbdiary.gov.lk"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Designation */}
                  <div className="flex flex-col text-left">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.designation}</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Sub-Inspector"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Department */}
                  <div className="flex flex-col text-left">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.department}</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Security Unit"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col text-left">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.password} *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 py-3 font-sans text-xs font-bold text-white shadow-lg uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  ) : (
                    <Check className="h-4.5 w-4.5 text-amber-500" />
                  )}
                  <span>{t.signUp}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(""); setSuccess(""); }}
                    className="font-sans text-xs text-slate-400 hover:text-white hover:underline transition-all"
                  >
                    {t.alreadyHaveAccount} <span className="text-amber-500 font-bold">{t.signIn}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* SIGN IN SCREEN */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="text-left mb-6">
                  <h2 className="font-sans text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Lock className="h-4.5 w-4.5 text-amber-500" />
                    <span>Portal Sign In</span>
                  </h2>
                  <p className="font-sans text-xs text-slate-500 mt-1">
                    Authenticate your identity credential to access the SB Diary
                  </p>
                </div>

                {/* Email */}
                <div className="flex flex-col text-left">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@sbdiary.gov.lk"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-4 py-2.5 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.password}</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="font-sans text-[10px] font-bold text-amber-500 hover:underline"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-4 py-2.5 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 py-3.5 font-sans text-xs font-black text-white shadow-lg uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                  id="login-submit-btn"
                >
                  {loading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  ) : (
                    <Lock className="h-4.5 w-4.5 text-amber-500" />
                  )}
                  <span>{t.signIn}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(""); setSuccess(""); }}
                    className="font-sans text-xs text-slate-400 hover:text-white hover:underline transition-all"
                  >
                    {t.noAccount} <span className="text-amber-500 font-bold">{t.signUp}</span>
                  </button>
                </div>

                {/* Demo Mode Helper Fast Logins */}
                {isDemo && (
                  <div className="mt-6 border-t border-slate-800/80 pt-5 text-left">
                    <div className="flex items-center space-x-1.5 mb-3 text-amber-500">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider">
                        Sandbox Fast Bypass logins
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoSelect("superadmin@sbdiary.gov.lk")}
                        className="rounded-lg border border-slate-800 bg-slate-950/20 px-2 py-2 text-[9px] font-bold text-indigo-400 hover:bg-slate-900/60 uppercase text-center transition-all"
                      >
                        Super Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoSelect("admin@sbdiary.gov.lk")}
                        className="rounded-lg border border-slate-800 bg-slate-950/20 px-2 py-2 text-[9px] font-bold text-amber-500 hover:bg-slate-900/60 uppercase text-center transition-all"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoSelect("officer@sbdiary.gov.lk")}
                        className="rounded-lg border border-slate-800 bg-slate-950/20 px-2 py-2 text-[9px] font-bold text-emerald-400 hover:bg-slate-900/60 uppercase text-center transition-all"
                      >
                        Officer
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )
          ) : (
            /* FORGOT PASSWORD SCREEN */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="text-left mb-6">
                <h2 className="font-sans text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Key className="h-4.5 w-4.5 text-amber-500" />
                  <span>{t.forgotPassword}</span>
                </h2>
                <p className="font-sans text-xs text-slate-500 mt-1">
                  Supply your registered email address below to dispatch a recovery simulation link
                </p>
              </div>

              {/* Forgot Email */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t.email}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="officer@sbdiary.gov.lk"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-4 py-2.5 font-sans text-xs font-semibold text-slate-300 focus:border-indigo-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setError(""); setSuccess(""); }}
                  className="rounded-xl border border-slate-800 bg-slate-950/20 py-3 font-sans text-xs font-bold text-slate-400 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center space-x-1 px-4 py-3 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl font-sans text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-white mr-1" />}
                  <span>{t.resetPassword}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
