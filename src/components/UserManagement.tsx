import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, UserX, Trash2, Edit3, Plus, Search, 
  ShieldAlert, Mail, Lock, Check, X, Key, AlertTriangle, Loader2, MoreVertical, ArrowLeft 
} from "lucide-react";
import { UserProfile, UserRole, translations } from "../types";
import { getAllUsers, createUserProfile, updateUserProfile, deleteUserProfile, getSessionUser } from "../lib/db";

interface UserManagementProps {
  language: 'en' | 'si';
  onBackToHome?: () => void;
}

export default function UserManagement({
  language,
  onBackToHome
}: UserManagementProps) {
  const t = translations[language];
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [roleTab, setRoleTab] = useState<'all' | 'admins' | 'officers'>('all');

  const currentUser = getSessionUser();

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("User");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [active, setActive] = useState(true);

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (activeDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest(".user-dropdown-container")) {
          setActiveDropdownId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdownId]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const u = await getAllUsers();
      setUsersList(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setEmail("");
    setDisplayName("");
    setRole("User");
    setDesignation("");
    setDepartment("");
    setActive(true);
    setError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEmail(user.email);
    setDisplayName(user.displayName);
    setRole(user.role);
    setDesignation(user.designation || "");
    setDepartment(user.department || "");
    setActive(user.active);
    setError("");
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim() || !displayName.trim()) {
      return setError("Email and Display Name are required.");
    }

    try {
      if (editingUser) {
        // Edit flow
        const updated = {
          ...editingUser,
          email: email.trim(),
          displayName: displayName.trim(),
          role,
          designation: designation.trim(),
          department: department.trim(),
          active
        };
        await updateUserProfile(updated);
        setSuccessMsg(`User profile '${displayName}' updated successfully!`);
      } else {
        // Create flow
        const newUid = "uid-" + Date.now() + Math.random().toString(36).substring(2, 4);
        await createUserProfile({
          uid: newUid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          role,
          designation: designation.trim(),
          department: department.trim(),
          active
        });
        setSuccessMsg(`New officer '${displayName}' registered successfully!`);
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to complete operations.");
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert("You are not allowed to disable your own active session account.");
      return;
    }
    
    try {
      const updated = { ...user, active: !user.active };
      await updateUserProfile(updated);
      setSuccessMsg(`User status updated to ${updated.active ? 'Active' : 'Disabled'}.`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    setSuccessMsg(`Reset link triggered. A simulation link was dispatched to ${user.email}.`);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert("You cannot delete the currently logged in session user.");
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to delete ${user.displayName}? All system records will remain, but login permissions will be permanently revoked.`)) {
      try {
        await deleteUserProfile(user.uid);
        setSuccessMsg("User removed from the office registry directory.");
        loadUsers();
      } catch (err: any) {
        alert(err.message || "Deletion failed.");
      }
    }
  };

  // Filter users
  const filteredUsers = usersList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.designation && u.designation.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );

    if (!matchesSearch) return false;

    // Super Admin role segmentation tabs
    if (currentUser?.role === 'Super Admin') {
      if (roleTab === 'admins') return u.role === 'Admin';
      if (roleTab === 'officers') return u.role === 'User';
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Super Admin Back to Dashboard Button */}
      {currentUser?.role === 'Super Admin' && onBackToHome && (
        <div className="flex justify-start">
          <button
            onClick={onBackToHome}
            className="flex items-center space-x-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4.5 py-2 font-sans text-xs font-bold dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-800/50 cursor-pointer shadow-xs"
            id="super-admin-back-to-home-btn"
          >
            <ArrowLeft className="h-4 w-4 text-indigo-900 dark:text-amber-500" />
            <span>{language === 'si' ? 'නැවත මුල් පිටුවට' : 'Back to Dashboard'}</span>
          </button>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
            <span>{t.usersManagement}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Register new administrative officers, delegate authority roles, or restrict active portal entries
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 rounded-xl bg-indigo-900 px-5 py-3 font-sans text-xs font-bold text-white shadow-md hover:bg-indigo-950 dark:bg-indigo-950 dark:hover:bg-slate-900 border border-amber-500/20 transition-all mt-3 md:mt-0 cursor-pointer"
          id="user-mgmt-create-btn"
        >
          <Plus className="h-4 w-4" />
          <span>{t.createUser}</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center space-x-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar & Role Sub-tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officers by name, email, designation or department..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400"
          />
        </div>

        {/* Super Admin Tab Selector */}
        {currentUser?.role === 'Super Admin' && (
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl self-start md:self-auto border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setRoleTab('all')}
              className={`rounded-lg px-4 py-1.5 text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'all'
                  ? "bg-white text-indigo-900 dark:bg-slate-900 dark:text-amber-500 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              All ({usersList.length})
            </button>
            <button
              onClick={() => setRoleTab('admins')}
              className={`rounded-lg px-4 py-1.5 text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'admins'
                  ? "bg-white text-indigo-900 dark:bg-slate-900 dark:text-amber-500 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
              id="sub-tab-admins-btn"
            >
              Admins ({usersList.filter(u => u.role === 'Admin').length})
            </button>
            <button
              onClick={() => setRoleTab('officers')}
              className={`rounded-lg px-4 py-1.5 text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'officers'
                  ? "bg-white text-indigo-900 dark:bg-slate-900 dark:text-amber-500 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
              id="sub-tab-officers-btn"
            >
              Officers ({usersList.filter(u => u.role === 'User').length})
            </button>
          </div>
        )}
      </div>

      {/* Directory Table Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Officer Details</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Designation / Department</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Access Role</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Registry Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Actions Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No administrative officers found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.uid === currentUser?.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      
                      {/* Officer details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3 text-left">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 text-xs font-bold font-mono uppercase">
                            {(u.displayName || u.email || "O").substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <span>{u.displayName || u.email}</span>
                              {isSelf && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-800 border border-amber-200">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <p className="font-bold">{u.designation || "OIC"}</p>
                        <p className="font-mono text-[10px] opacity-80 mt-0.5">{u.department || "Headquarters"}</p>
                      </td>

                      {/* Access Role */}
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] ${
                          u.role === 'Super Admin' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300' :
                          u.role === 'Admin' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Active Toggle Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase transition-all ${
                            u.active 
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                          }`}
                        >
                          {u.active ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                          <span>{u.active ? t.activeStatus : t.inactiveStatus}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 relative">
                        <div className="flex items-center space-x-2 user-dropdown-container" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === u.uid ? null : u.uid)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                            title="Actions"
                            id={`user-actions-${u.uid}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Super Admin Direct Delete Button */}
                          {currentUser?.role === 'Super Admin' && !isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-1.5 text-red-600 transition-all dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950 cursor-pointer"
                              title="Delete Officer (පරිශීලකයා ඉවත් කරන්න)"
                              id={`user-direct-delete-${u.uid}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {activeDropdownId === u.uid && (
                            <div className="absolute right-4 mt-1 w-48 origin-top-right rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950 z-50 ring-1 ring-black/5 animate-in fade-in duration-100 text-left">
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleOpenEditModal(u);
                                }}
                                className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                id={`user-edit-${u.uid}`}
                              >
                                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                <span>{t.editUser}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleResetPassword(u);
                                }}
                                className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Key className="h-3.5 w-3.5 text-slate-400" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleDeleteUser(u);
                                }}
                                disabled={isSelf}
                                className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                                id={`user-delete-${u.uid}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                <span>{t.deleteUser}</span>
                              </button>
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

      {/* User Edit / Create Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800 bg-slate-900 text-white rounded-t-2xl">
              <span className="font-sans text-xs font-bold uppercase tracking-wider">
                {editingUser ? t.editUser : t.createUser}
              </span>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Display Name */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Display Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Inspector Nimal Senanayake"
                  className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nimal@sbdiary.gov.lk"
                  className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              {/* Designation */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Officer-in-Charge"
                  className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Investigation Unit"
                  className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col text-left">
                <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">System Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="User">User (Assigned access only)</option>
                  <option value="Admin">Admin (Full directory control)</option>
                  <option value="Super Admin">Super Admin (System configuration)</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="font-sans text-xs font-bold text-slate-600 dark:text-slate-300">Set Account Active</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-900 border-slate-300 rounded-md focus:ring-indigo-900"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-900 hover:bg-indigo-950 px-5 py-2 font-sans text-xs font-bold text-white shadow-xs dark:bg-indigo-950 dark:hover:bg-slate-900"
                >
                  Save User
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
