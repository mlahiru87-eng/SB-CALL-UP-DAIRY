import React, { useState } from "react";
import { 
  X, Check, Calendar, User, FileText, Building, MapPin, 
  AlertTriangle, CheckCircle2, ArrowRight, Paperclip, Loader2 
} from "lucide-react";
import { CallUpEntry, UserProfile, Attachment, translations } from "../types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

interface EntryDetailsProps {
  user: UserProfile;
  language: 'en' | 'si';
  entry: CallUpEntry;
  onComplete: (id: string, completionData: {
    submissionReferenceNumber: string;
    submissionDate: string;
    submittedBy: string;
    completionNotes: string;
    completionAttachment?: Attachment;
  }) => Promise<void>;
  onClose: () => void;
}

export default function EntryDetails({
  user,
  language,
  entry,
  onComplete,
  onClose
}: EntryDetailsProps) {
  const t = translations[language];
  const [completing, setCompleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Completion fields
  const [subRefNum, setSubRefNum] = useState("");
  const [subDate, setSubDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subBy, setSubBy] = useState(() => user.displayName);
  const [compNotes, setCompNotes] = useState("");
  const [completionAttachment, setCompletionAttachment] = useState<Attachment | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const isCompleted = entry.status === 'Completed';
  
  // Authorization check: Only assigned officer or Admin/Super Admin can complete
  const canComplete = !isCompleted && (
    user.role === 'Super Admin' || 
    user.role === 'Admin' || 
    entry.responsibleOfficer === user.uid ||
    (entry.responsibleOfficers && entry.responsibleOfficers.includes(user.uid)) ||
    (entry.responsibleOfficer && entry.responsibleOfficer.split(",").map(id => id.trim()).includes(user.uid))
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    setError("");

    try {
      const f = files[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      let type: Attachment['type'] = 'other';
      
      if (ext === 'pdf') type = 'pdf';
      else if (['doc', 'docx'].includes(ext || '')) type = 'word';
      else if (['xls', 'xlsx'].includes(ext || '')) type = 'excel';
      else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) type = 'image';

      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      
      let fileUrl = "#";
      if (storage) {
        const storageRef = ref(storage, `completion_reports/${Date.now()}_${f.name}`);
        const snapshot = await uploadBytes(storageRef, f);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      setCompletionAttachment({
        name: f.name,
        url: fileUrl,
        type,
        size: `${sizeMB} MB`
      });
    } catch (err: any) {
      console.error("Storage upload failed:", err);
      setError("Failed to upload completion report to secure storage: " + (err.message || err));
    } finally {
      setUploadingFile(false);
    }
  };

  const removeCompletionAttachment = () => {
    setCompletionAttachment(null);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subRefNum.trim()) return setError("Submission Reference Number is required.");
    if (!subDate) return setError("Submission Date is required.");
    if (!subBy.trim()) return setError("Submitted By name is required.");
    if (!compNotes.trim()) return setError("Completion notes are required.");

    setSubmitting(true);
    try {
      await onComplete(entry.id, {
        submissionReferenceNumber: subRefNum.trim(),
        submissionDate: subDate,
        submittedBy: subBy.trim(),
        completionNotes: compNotes.trim(),
        ...(completionAttachment ? { completionAttachment } : {})
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to finalize completion status.");
    } finally {
      setSubmitting(false);
    }
  };

  let priorityStyle = "";
  if (entry.priority === 'Urgent') priorityStyle = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold";
  else if (entry.priority === 'High') priorityStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  else if (entry.priority === 'Medium') priorityStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  else priorityStyle = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-amber-500" />
            <span className="font-mono text-xs font-bold tracking-widest text-amber-500 uppercase">{entry.recordNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Title, Classification & Badges */}
          <div className="border-b border-slate-100 pb-4 text-left dark:border-slate-800">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityStyle}`}>
                {entry.priority}
              </span>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 uppercase tracking-wider">
                {entry.letterType}
              </span>
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                entry.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                entry.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {entry.status}
              </span>
            </div>
            <h1 className="font-sans text-lg font-black text-slate-900 dark:text-white leading-snug">
              {entry.subject}
            </h1>
            <p className="font-mono text-[10px] text-slate-400 mt-1">
              {t.refNumber}: <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.referenceNumber}</span>
            </p>
          </div>

          {/* Details Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
            
            <div className="flex items-start space-x-2.5">
              <Building className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.officeInstitution}</span>
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.officeInstitution}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <MapPin className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.submissionLocation}</span>
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.submissionLocation}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <User className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.responsibleOfficer}</span>
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.responsibleOfficerName || entry.responsibleOfficer}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Calendar className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadlines & Receiving</span>
                <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  Recv: {entry.dateReceived} &bull; <span className="text-red-600 dark:text-red-400">Due: {entry.dueDate}</span>
                </p>
              </div>
            </div>

          </div>

          {/* Description Section */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left dark:border-slate-800 dark:bg-slate-950/40">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.description}</span>
            <p className="font-sans text-xs leading-relaxed font-semibold text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
              {entry.description}
            </p>
          </div>

          {/* Remarks Section */}
          {entry.remarks && (
            <div className="text-left">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.remarks}</span>
              <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">{entry.remarks}</p>
            </div>
          )}

          {/* Attachments list */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div className="text-left border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">{t.attachments}</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {entry.attachments.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Paperclip className="h-4 w-4 text-indigo-800 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{file.name}</span>
                        {file.size && <span className="font-mono text-[9px] text-slate-400 mt-0.5">{file.size}</span>}
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert("File downloaded/opened (Secured Archive Simulation)."); }}
                      className="rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Metadata */}
          <div className="flex flex-col text-left space-y-1 text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-4 dark:border-slate-800">
            <span>Registered By: {entry.createdByName || entry.createdBy} on {new Date(entry.createdAt).toLocaleString()}</span>
            {entry.updatedAt && (
              <span>Last Modified By: {entry.updatedByName || entry.updatedBy} on {new Date(entry.updatedAt).toLocaleString()}</span>
            )}
          </div>

          {/* Completion Logs / Submissions Display (If Completed) */}
          {isCompleted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 text-left dark:border-emerald-950/40 dark:bg-emerald-950/10">
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 mb-3 font-sans font-black text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span>Completion & Delivery Records</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.submissionRef}</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.submissionReferenceNumber}</p>
                </div>
                <div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.submissionDate}</span>
                  <p className="font-sans font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.submissionDate}</p>
                </div>
                <div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.submittedBy}</span>
                  <p className="font-sans font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.submittedBy}</p>
                </div>
                <div>
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.completedBy}</span>
                  <p className="font-sans font-bold text-slate-800 dark:text-slate-200 mt-0.5">{entry.completedByName || entry.completedBy} ({new Date(entry.completedAt || '').toLocaleDateString()})</p>
                </div>
              </div>
              <div className="mt-3.5 border-t border-emerald-100/60 pt-2 dark:border-emerald-950/20">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.completionNotes}</span>
                <p className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{entry.completionNotes}</p>
              </div>

              {entry.completionAttachment && (
                <div className="mt-3 border-t border-emerald-100/60 pt-2.5 dark:border-emerald-950/20">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">Completion Report File (වාර්තාව)</span>
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200/50 bg-white p-2 text-xs dark:border-emerald-800 dark:bg-slate-900 mt-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Paperclip className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="font-sans font-bold text-slate-800 dark:text-slate-200 truncate pr-1 max-w-[180px]">{entry.completionAttachment.name}</span>
                        {entry.completionAttachment.size && <span className="font-mono text-[9px] text-slate-400">{entry.completionAttachment.size}</span>}
                      </div>
                    </div>
                    <a
                      href={entry.completionAttachment.url && entry.completionAttachment.url !== "#" ? entry.completionAttachment.url : undefined}
                      target={entry.completionAttachment.url && entry.completionAttachment.url !== "#" ? "_blank" : undefined}
                      rel={entry.completionAttachment.url && entry.completionAttachment.url !== "#" ? "noopener noreferrer" : undefined}
                      onClick={(e) => { 
                        if (!entry.completionAttachment?.url || entry.completionAttachment.url === "#") {
                          e.preventDefault(); 
                          alert("Opening Completion Report document (Secured Simulation)."); 
                        }
                      }}
                      className="rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 transition-all dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 cursor-pointer"
                    >
                      Download Report
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mark Completed Workflow Form (Toggle collapsible) */}
          {!isCompleted && canComplete && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              {!completing ? (
                <button
                  type="button"
                  onClick={() => setCompleting(true)}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 p-3 font-sans text-xs font-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                  id="details-complete-trigger-btn"
                >
                  <Check className="h-4.5 w-4.5" />
                  <span>{t.markCompleted}</span>
                </button>
              ) : (
                <form onSubmit={handleCompleteSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Enter Submission Documents
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompleting(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Submission Ref */}
                    <div className="flex flex-col">
                      <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {t.submissionRef} *
                      </label>
                      <input
                        type="text"
                        value={subRefNum}
                        onChange={(e) => setSubRefNum(e.target.value)}
                        placeholder="e.g. SUB/SBC/2026/9110"
                        className="rounded-lg border border-slate-200 bg-white p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    {/* Submission Date */}
                    <div className="flex flex-col">
                      <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {t.submissionDate} *
                      </label>
                      <input
                        type="date"
                        value={subDate}
                        onChange={(e) => setSubDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Submitted By */}
                  <div className="flex flex-col">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t.submittedBy} *
                    </label>
                    <input
                      type="text"
                      value={subBy}
                      onChange={(e) => setSubBy(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-2 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Completion Notes */}
                  <div className="flex flex-col">
                    <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t.completionNotes} *
                    </label>
                    <textarea
                      value={compNotes}
                      onChange={(e) => setCompNotes(e.target.value)}
                      placeholder="e.g. Completed physical dispatch. All certifications acquired..."
                      rows={2.5}
                      className="rounded-lg border border-slate-200 bg-white p-2.5 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Optional Completion Report Attachment */}
                  <div className="flex flex-col border-t border-slate-200/50 pt-3 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Completion Report (Optional / වාර්තාව - අනිවාර්ය නොවේ)
                      </label>
                      
                      {!completionAttachment && !uploadingFile && (
                        <label className="flex items-center space-x-1.5 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
                          <Paperclip className="h-3.5 w-3.5" />
                          <span>Attach File</span>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {uploadingFile && (
                      <div className="flex items-center space-x-2 py-1 text-[9px] text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-900" />
                        <span>Uploading report securely to archive...</span>
                      </div>
                    )}

                    {completionAttachment && (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-1.5 text-[11px] sm:text-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-indigo-800 shrink-0" />
                          <div className="flex flex-col text-left min-w-0">
                            <span className="font-sans font-bold text-slate-800 dark:text-slate-200 truncate pr-1 max-w-[180px]">
                              {completionAttachment.name}
                            </span>
                            {completionAttachment.size && (
                              <span className="font-mono text-[9px] text-slate-400">
                                {completionAttachment.size} ({completionAttachment.type.toUpperCase()})
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeCompletionAttachment}
                          className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 p-2.5 font-sans text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                    id="details-complete-submit-btn"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Submit & Finalize Complete</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex h-14 items-center justify-end border-t border-slate-100 px-6 dark:border-slate-800 bg-slate-50 rounded-b-2xl dark:bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-5 py-2 font-sans text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
