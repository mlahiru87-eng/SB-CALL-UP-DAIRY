import React, { useState, useEffect } from "react";
import { 
  X, Save, Paperclip, AlertTriangle, FileText, Check, Loader2,
  ChevronDown, ChevronUp 
} from "lucide-react";
import { CallUpEntry, UserProfile, PriorityLevel, Attachment, translations } from "../types";
import { getAllUsers } from "../lib/db";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

interface EntryFormProps {
  language: 'en' | 'si';
  entry?: CallUpEntry; // If provided, we are editing
  onSave: (data: Omit<CallUpEntry, 'id' | 'recordNumber' | 'status' | 'createdBy' | 'createdAt'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

export default function EntryForm({
  language,
  entry,
  onSave,
  onClose
}: EntryFormProps) {
  const t = translations[language];
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form Fields (Main/Required)
  const [referenceNumber, setReferenceNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [remarks, setRemarks] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Advanced Fields (Collapsible)
  const [letterType, setLetterType] = useState("Official Letter");
  const [description, setDescription] = useState("");
  const [officeInstitution, setOfficeInstitution] = useState("");
  const [submissionLocation, setSubmissionLocation] = useState("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    async function loadOfficers() {
      try {
        const uList = await getAllUsers();
        setUsers(uList);
        if (!entry && uList.length > 0 && selectedOfficers.length === 0) {
          // preselect first user
          setSelectedOfficers([uList[0].uid]);
        }
      } catch (err) {
        console.error("Failed to load officers", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadOfficers();
  }, [entry]);

  // Hydrate form if editing
  useEffect(() => {
    if (entry) {
      setReferenceNumber(entry.referenceNumber);
      setSubject(entry.subject);
      setLetterType(entry.letterType || "Official Letter");
      setDescription(entry.description || "");
      setDateReceived(entry.dateReceived);
      setDueDate(entry.dueDate);
      
      if (entry.responsibleOfficers && entry.responsibleOfficers.length > 0) {
        setSelectedOfficers(entry.responsibleOfficers);
      } else if (entry.responsibleOfficer) {
        setSelectedOfficers(entry.responsibleOfficer.split(",").map(id => id.trim()).filter(Boolean));
      } else {
        setSelectedOfficers([]);
      }

      setOfficeInstitution(entry.officeInstitution || "");
      setSubmissionLocation(entry.submissionLocation || "");
      setPriority(entry.priority);
      setRemarks(entry.remarks || "");
      setAttachments(entry.attachments || []);

      // Auto expand if advanced fields contain custom data
      const hasAdvancedValues = 
        (entry.letterType && entry.letterType !== "Official Letter") ||
        (entry.officeInstitution && entry.officeInstitution !== "N/A" && entry.officeInstitution !== "") ||
        (entry.submissionLocation && entry.submissionLocation !== "N/A" && entry.submissionLocation !== "") ||
        (entry.description && entry.description !== entry.subject && entry.description !== "");
      
      if (hasAdvancedValues) {
        setShowAdvanced(true);
      }
    } else {
      // Set default dates for new entry
      const today = new Date().toISOString().split('T')[0];
      setDateReceived(today);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [entry]);

  // Handle secure document uploads to Firebase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    setError("");

    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = f.name.split('.').pop()?.toLowerCase();
        let type: Attachment['type'] = 'other';
        
        if (ext === 'pdf') type = 'pdf';
        else if (['doc', 'docx'].includes(ext || '')) type = 'word';
        else if (['xls', 'xlsx'].includes(ext || '')) type = 'excel';
        else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) type = 'image';

        const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
        
        let fileUrl = "#";
        if (storage) {
          const storageRef = ref(storage, `attachments/${Date.now()}_${f.name}`);
          const snapshot = await uploadBytes(storageRef, f);
          fileUrl = await getDownloadURL(snapshot.ref);
        }

        newAttachments.push({
          name: f.name,
          url: fileUrl,
          type,
          size: `${sizeMB} MB`
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err: any) {
      console.error("Storage upload failed:", err);
      setError("Failed to upload attachment to secure storage: " + (err.message || err));
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations (Keep only required fields simple)
    if (!referenceNumber.trim()) return setError("Reference Number is required.");
    if (!subject.trim()) return setError("Document Subject is required.");
    if (!dateReceived) return setError("Received Date is required.");
    if (!dueDate) return setError("Due Date is required.");
    if (selectedOfficers.length === 0) return setError("Please assign at least one responsible officer.");

    // Ensure due date is not before received date
    if (dueDate < dateReceived) {
      return setError("Due Date cannot be prior to the Date Received.");
    }

    setSaving(true);
    try {
      // Find display names for selected officers
      const officersList = selectedOfficers.map(uid => {
        const u = users.find(userObj => userObj.uid === uid);
        return {
          uid,
          displayName: u ? u.displayName : "Assigned Officer"
        };
      });

      const responsibleOfficer = officersList.map(o => o.uid).join(",");
      const responsibleOfficerName = officersList.map(o => o.displayName).join(", ");
      const responsibleOfficers = officersList.map(o => o.uid);
      const responsibleOfficerNames = officersList.map(o => o.displayName);

      // Fallback defaults for advanced fields to preserve all existing functionality
      const finalDescription = description.trim() || subject.trim();
      const finalOfficeInstitution = officeInstitution.trim() || "N/A";
      const finalSubmissionLocation = submissionLocation.trim() || "N/A";
      const finalLetterType = letterType || "Official Letter";

      await onSave({
        ...(entry ? { id: entry.id } : {}),
        referenceNumber: referenceNumber.trim(),
        subject: subject.trim(),
        letterType: finalLetterType,
        description: finalDescription,
        dateReceived,
        dueDate,
        responsibleOfficer,
        responsibleOfficerName,
        responsibleOfficers,
        responsibleOfficerNames,
        officeInstitution: finalOfficeInstitution,
        submissionLocation: finalSubmissionLocation,
        priority,
        remarks: remarks.trim(),
        attachments
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save document record.");
    } finally {
      setSaving(true); // matching existing state flow or turning off
      setSaving(false);
    }
  };

  const letterTypes = [
    "Official Letter",
    "Confidential Document",
    "Circular / Directive",
    "General Correspondence"
  ];

  const priorityLevels: PriorityLevel[] = ["Low", "Medium", "High", "Urgent"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-all">
        
        {/* Header */}
        <div className="flex h-13 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <FileText className="h-4.5 w-4.5 text-amber-500" />
            <h2 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider">
              {entry ? `${t.editEntry} - ${entry.recordNumber}` : t.createEntry}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-950/40">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reference Number */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.refNumber} *
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. MOD/SEC/26/092"
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
              required
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.subject} *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary subject of the correspondence"
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Date Received */}
            <div className="flex flex-col text-left">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t.dateReceived} *
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                required
              />
            </div>

            {/* Due Date */}
            <div className="flex flex-col text-left">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t.dueDate} *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Responsible Officer */}
            <div className="flex flex-col text-left">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t.responsibleOfficer} *
              </label>
              {loadingUsers ? (
                <div className="flex items-center space-x-2 p-2 sm:p-2.5 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-800" />
                  <span>Loading directory...</span>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-950 max-h-36 overflow-y-auto space-y-1">
                  {users.map((u) => {
                    const isSelected = selectedOfficers.includes(u.uid);
                    return (
                      <label
                        key={u.uid}
                        className={`flex items-center space-x-2.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none ${
                          isSelected 
                            ? "bg-indigo-50/70 border-indigo-100 text-indigo-900 dark:bg-indigo-950/25 dark:border-indigo-950/40 dark:text-indigo-300"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedOfficers(selectedOfficers.filter(id => id !== u.uid));
                            } else {
                              setSelectedOfficers([...selectedOfficers, u.uid]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="flex-1 truncate">
                          {u.displayName} <span className="text-[10px] text-slate-400 font-normal">({u.designation || u.role})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Level */}
            <div className="flex flex-col text-left">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t.priority} *
              </label>
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-0.5">
                {priorityLevels.map((lvl) => {
                  const isSelected = priority === lvl;
                  let colorStyle = "";
                  
                  if (lvl === "Low") colorStyle = isSelected ? "bg-slate-500 text-white border-slate-600" : "hover:bg-slate-100 text-slate-500 border-slate-200 dark:border-slate-800 dark:hover:bg-slate-800";
                  else if (lvl === "Medium") colorStyle = isSelected ? "bg-emerald-600 text-white border-emerald-700" : "hover:bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-slate-800 dark:hover:bg-emerald-950/20";
                  else if (lvl === "High") colorStyle = isSelected ? "bg-amber-500 text-white border-amber-600" : "hover:bg-amber-50 text-amber-500 border-amber-100 dark:border-slate-800 dark:hover:bg-amber-950/20";
                  else colorStyle = isSelected ? "bg-red-600 text-white border-red-700" : "hover:bg-red-50 text-red-600 border-red-100 dark:border-slate-800 dark:hover:bg-red-950/20";

                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`rounded-lg border py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${colorStyle}`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.remarks}
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal remarks or side notes"
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-2.5 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Attachments Section */}
          <div className="flex flex-col text-left border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t.attachments}
              </label>
              
              {/* Attachment File Input */}
              <label className="flex items-center space-x-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 transition-all">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{t.addAttachment}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingFile && (
              <div className="flex items-center space-x-2 py-1 text-[9px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-900" />
                <span>Uploading documents securely to archive...</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 mt-1">
                {attachments.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] sm:text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-indigo-800 shrink-0" />
                      <div className="flex flex-col text-left min-w-0">
                        <span className="font-sans font-bold text-slate-800 dark:text-slate-200 truncate pr-1 max-w-[150px]">{file.name}</span>
                        {file.size && <span className="font-mono text-[9px] text-slate-400">{file.size} ({file.type.toUpperCase()})</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collapsible "More Details" section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>{language === "si" ? "වැඩිදුර විස්තර (විකල්ප)" : "More Details (Optional)"}</span>
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 sm:p-4 space-y-3.5 dark:border-slate-800/50 dark:bg-slate-950/20 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                
                {/* Letter Classification & Office/Institution */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t.letterType}
                    </label>
                    <select
                      value={letterType}
                      onChange={(e) => setLetterType(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {letterTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t.officeInstitution}
                    </label>
                    <input
                      type="text"
                      value={officeInstitution}
                      onChange={(e) => setOfficeInstitution(e.target.value)}
                      placeholder="e.g. Ministry of Defence"
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Submission Location */}
                <div className="flex flex-col">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t.submissionLocation}
                  </label>
                  <input
                    type="text"
                    value={submissionLocation}
                    onChange={(e) => setSubmissionLocation(e.target.value)}
                    placeholder="Where should the action report go?"
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                {/* Detailed Description */}
                <div className="flex flex-col">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed description, tasks required, or operational directions..."
                    rows={2.5}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 font-sans text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

              </div>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="flex h-13 items-center justify-end border-t border-slate-100 px-5 dark:border-slate-800 bg-slate-50 rounded-b-2xl dark:bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-4 py-1.5 font-sans text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all mr-2.5 cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 px-5 py-1.5 font-sans text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 dark:bg-indigo-950 dark:hover:bg-slate-900 transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{t.save}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
