import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, 
  query, where, orderBy, limit, Timestamp 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail, 
  createUserWithEmailAndPassword, updateProfile 
} from "firebase/auth";
import { db, auth, isFirebaseEnabled } from "./firebase";
import { 
  UserProfile, CallUpEntry, ActivityLog, SystemNotification, 
  SystemSettings, UserRole, PriorityLevel, EntryStatus, Attachment 
} from "../types";

// ==========================================
// FIRESTORE ERROR HANDLING (MANDATORY)
// ==========================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Key for Demo/LocalStorage mode
const DEMO_MODE_KEY = "sb_call_up_diary_demo_mode";
const LOCAL_STORAGE_DB_PREFIX = "sb_diary_";

// Helper to check if Demo Mode is active
export const getIsDemoMode = (): boolean => {
  if (!isFirebaseEnabled) return true;
  const val = localStorage.getItem(DEMO_MODE_KEY);
  return val === "true" || val === null; // Default to true so it works out-of-the-box, but can be set to false for Live Firebase
};

export const setIsDemoMode = (active: boolean) => {
  localStorage.setItem(DEMO_MODE_KEY, active ? "true" : "false");
};

// Helper to strip undefined values so Firestore does not fail
export const cleanUndefined = (obj: any): any => {
  if (obj === undefined || obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
};

// ==========================================
// PRE-SEEDED DEMO DATA
// ==========================================

const defaultSettings: SystemSettings = {
  organizationName: "Special Branch, Head Office - Sri Lanka Police",
  organizationLogo: "",
  emailNotifications: true,
  reminderDaysBefore: 3
};

const preSeededUsers: UserProfile[] = [
  {
    uid: "sa-1",
    email: "superadmin@sbdiary.gov.lk",
    displayName: "Senior DIG K. S. de Silva",
    role: "Super Admin",
    designation: "Senior Deputy Inspector General of Police",
    department: "Special Branch Head Office",
    active: true,
    createdAt: "2026-01-10T08:30:00Z"
  },
  {
    uid: "a-1",
    email: "admin@sbdiary.gov.lk",
    displayName: "ASP Priyantha Bandara",
    role: "Admin",
    designation: "Assistant Superintendent of Police",
    department: "Intelligence Division",
    active: true,
    createdAt: "2026-01-15T09:15:00Z"
  },
  {
    uid: "u-1",
    email: "officer@sbdiary.gov.lk",
    displayName: "Inspector Nimal Senanayake",
    role: "User",
    designation: "Officer-in-Charge (OIC)",
    department: "Investigation Unit",
    active: true,
    createdAt: "2026-01-20T10:00:00Z"
  },
  {
    uid: "u-2",
    email: "jayasekara@sbdiary.gov.lk",
    displayName: "SI S. Jayasekara",
    role: "User",
    designation: "Sub-Inspector",
    department: "Security Unit",
    active: true,
    createdAt: "2026-02-01T11:30:00Z"
  }
];

const preSeededEntries: CallUpEntry[] = [
  {
    id: "entry-1",
    recordNumber: "SBC/2026/0001",
    referenceNumber: "MOD/SEC/26/092",
    subject: "National Security Council Briefing Note",
    letterType: "Confidential Document",
    description: "Provide comprehensive security briefing report for the upcoming VIP delegates' visit to the Southern Province. Detail protection layers, routes, and risk analysis.",
    dateReceived: "2026-06-20",
    dueDate: "2026-06-25", // 2 days from local time 2026-06-23
    responsibleOfficer: "u-1",
    responsibleOfficerName: "Inspector Nimal Senanayake",
    officeInstitution: "Ministry of Defence",
    submissionLocation: "Secretary to the Ministry of Defence, Colombo 03",
    priority: "Urgent",
    status: "Pending",
    remarks: "Coordinate directly with the VIP Security Unit.",
    attachments: [
      { name: "security_protocol_v5.pdf", url: "#", type: "pdf", size: "1.2 MB" }
    ],
    createdBy: "a-1",
    createdByName: "ASP Priyantha Bandara",
    createdAt: "2026-06-20T08:30:00Z"
  },
  {
    id: "entry-2",
    recordNumber: "SBC/2026/0002",
    referenceNumber: "IGP/OUT/CIRC/045",
    subject: "Circular on Emergency Public Alert Protocols",
    letterType: "Circular / Directive",
    description: "Implementation of the revised circular regarding standard operating procedures (SOP) for emergency public alerts during natural disasters.",
    dateReceived: "2026-06-18",
    dueDate: "2026-06-28", // 5 days from local time 2026-06-23
    responsibleOfficer: "u-2",
    responsibleOfficerName: "SI S. Jayasekara",
    officeInstitution: "Police Headquarters, Colombo 11",
    submissionLocation: "DIG (Admin), Police HQ",
    priority: "High",
    status: "In Progress",
    remarks: "Needs to be circularized among all regional stations.",
    attachments: [
      { name: "igp_circular_alert.xlsx", url: "#", type: "excel", size: "340 KB" }
    ],
    createdBy: "a-1",
    createdByName: "ASP Priyantha Bandara",
    createdAt: "2026-06-18T10:15:00Z"
  },
  {
    id: "entry-3",
    recordNumber: "SBC/2026/0003",
    referenceNumber: "PM/GEN/26/112",
    subject: "Public Grievance Redressal Plan - Sabaragamuwa Province",
    letterType: "Official Letter",
    description: "Directives from the Prime Minister's Office to resolve the security grievances raised by local traders in the Sabaragamuwa region.",
    dateReceived: "2026-06-10",
    dueDate: "2026-06-21", // Past date - Overdue
    responsibleOfficer: "u-1",
    responsibleOfficerName: "Inspector Nimal Senanayake",
    officeInstitution: "Prime Minister's Office",
    submissionLocation: "Prime Minister's Secretariat",
    priority: "High",
    status: "Overdue",
    remarks: "OIC to expedite. Delayed due to provincial board coordination.",
    attachments: [],
    createdBy: "sa-1",
    createdByName: "Senior DIG K. S. de Silva",
    createdAt: "2026-06-10T09:00:00Z"
  },
  {
    id: "entry-4",
    recordNumber: "SBC/2026/0004",
    referenceNumber: "CBSL/GOV/2026/02",
    subject: "Financial Security Clearance Certification",
    letterType: "General Correspondence",
    description: "Security vetting report required for senior staff recruitments in the Currency Department of Central Bank of Sri Lanka.",
    dateReceived: "2026-06-15",
    dueDate: "2026-06-23", // Due today
    responsibleOfficer: "u-2",
    responsibleOfficerName: "SI S. Jayasekara",
    officeInstitution: "Central Bank of Sri Lanka",
    submissionLocation: "Governor, Central Bank of Sri Lanka",
    priority: "Medium",
    status: "Pending",
    remarks: "Confidential vetting completed, awaiting final clearance sign-off.",
    attachments: [],
    createdBy: "a-1",
    createdByName: "ASP Priyantha Bandara",
    createdAt: "2026-06-15T14:30:00Z"
  },
  {
    id: "entry-5",
    recordNumber: "SBC/2026/0005",
    referenceNumber: "DMT/COL/REG/99",
    subject: "Security Audit of Smart Card Driving License System",
    letterType: "Official Letter",
    description: "Submit comments and vulnerability review on the physical security of the card personalisation center at Werahera.",
    dateReceived: "2026-06-05",
    dueDate: "2026-06-18",
    responsibleOfficer: "u-1",
    responsibleOfficerName: "Inspector Nimal Senanayake",
    officeInstitution: "Department of Motor Traffic",
    submissionLocation: "Commissioner General, DMT, Colombo 05",
    priority: "Medium",
    status: "Completed",
    remarks: "Report handed over successfully.",
    attachments: [
      { name: "dmt_audit_report.pdf", url: "#", type: "pdf", size: "4.5 MB" }
    ],
    createdBy: "a-1",
    createdByName: "ASP Priyantha Bandara",
    createdAt: "2026-06-05T11:00:00Z",
    
    // Completion details
    submissionReferenceNumber: "SUB/SBC/2026/9110",
    submissionDate: "2026-06-18",
    submittedBy: "Inspector Nimal Senanayake",
    completionNotes: "All audits successfully passed. Final hand-over completed in person.",
    completedAt: "2026-06-18T16:00:00Z",
    completedBy: "u-1",
    completedByName: "Inspector Nimal Senanayake"
  }
];

const preSeededLogs: ActivityLog[] = [
  {
    id: "log-1",
    userId: "sa-1",
    userName: "Senior DIG K. S. de Silva",
    userEmail: "superadmin@sbdiary.gov.lk",
    userRole: "Super Admin",
    action: "Login",
    details: "User logged into the system from IP 192.168.1.100",
    timestamp: "2026-06-23T08:00:00Z"
  },
  {
    id: "log-2",
    userId: "a-1",
    userName: "ASP Priyantha Bandara",
    userEmail: "admin@sbdiary.gov.lk",
    userRole: "Admin",
    action: "Create Entry",
    details: "Created entry SBC/2026/0001 (Ref: MOD/SEC/26/092)",
    timestamp: "2026-06-20T08:31:00Z"
  },
  {
    id: "log-3",
    userId: "u-1",
    userName: "Inspector Nimal Senanayake",
    userEmail: "officer@sbdiary.gov.lk",
    userRole: "User",
    action: "Complete Entry",
    details: "Marked SBC/2026/0005 as Completed (Sub Ref: SUB/SBC/2026/9110)",
    timestamp: "2026-06-18T16:00:00Z"
  }
];

const preSeededNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    title: "Entry Due Today",
    message: "Financial Security Clearance Certification (Ref: CBSL/GOV/2026/02) is due today!",
    type: "warning",
    readBy: [],
    createdAt: "2026-06-23T07:00:00Z"
  },
  {
    id: "notif-2",
    title: "Overdue Entry Warning",
    message: "Public Grievance Redressal Plan - Sabaragamuwa Province is overdue by 2 days!",
    type: "error",
    readBy: [],
    createdAt: "2026-06-23T07:05:00Z"
  },
  {
    id: "notif-3",
    title: "Document Assigned",
    message: "You have been assigned to 'National Security Council Briefing Note' (Ref: MOD/SEC/26/092)",
    type: "info",
    targetUserId: "u-1",
    readBy: [],
    createdAt: "2026-06-20T08:30:00Z"
  }
];

// Helper to initialize LocalStorage with preseeded data if it does not exist
export const initializeLocalStorage = () => {
  if (localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "initialized") === "true") {
    // Check if overdue auto-updating is needed based on current date
    autoUpdateOverdueStatusLocal();
    return;
  }
  
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "users", JSON.stringify(preSeededUsers));
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(preSeededEntries));
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "logs", JSON.stringify(preSeededLogs));
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "notifications", JSON.stringify(preSeededNotifications));
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "settings", JSON.stringify(defaultSettings));
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "initialized", "true");
  
  // Update status based on current date
  autoUpdateOverdueStatusLocal();
};

// Auto update overdue status for entries locally
const autoUpdateOverdueStatusLocal = () => {
  const entriesStr = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "entries");
  if (!entriesStr) return;
  const entries: CallUpEntry[] = JSON.parse(entriesStr);
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  let updated = false;
  const updatedEntries = entries.map(entry => {
    if (entry.status !== 'Completed' && entry.dueDate < todayStr && entry.status !== 'Overdue') {
      entry.status = 'Overdue';
      updated = true;
    }
    return entry;
  });
  
  if (updated) {
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(updatedEntries));
    // Log auto updates
    const logsStr = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "logs") || "[]";
    const logs: ActivityLog[] = JSON.parse(logsStr);
    const newLog: ActivityLog = {
      id: "log-" + Date.now(),
      userId: "system",
      userName: "System Scheduler",
      userEmail: "system@sbdiary.gov.lk",
      userRole: "Super Admin",
      action: "Status Update",
      details: "Automatically updated overdue status for items exceeding due date.",
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "logs", JSON.stringify(logs));
  }
};

// ==========================================
// SESSION MANAGEMENT (ACTIVE USER STATE)
// ==========================================
const CURRENT_USER_KEY = "sb_diary_active_user";

export const getSessionUser = (): UserProfile | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  const user: UserProfile = JSON.parse(userStr);
  
  // Verify user is active
  if (getIsDemoMode()) {
    const users = getLocalUsers();
    const dbUser = users.find(u => u.uid === user.uid);
    if (!dbUser || !dbUser.active) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return dbUser;
  }
  return user;
};

export const setSessionUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// ==========================================
// AUTHENTICATION INTERFACE
// ==========================================

export const signInUser = async (email: string, password: string): Promise<UserProfile> => {
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    const users = getLocalUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // For demo purposes, we accept any password or password123
    if (!user) {
      throw new Error("User record not found in SB Office Directory.");
    }
    if (!user.active) {
      throw new Error("This account has been disabled by an Administrator.");
    }
    
    setSessionUser(user);
    addLocalLog(user.uid, "Login", `User logged into the system (Demo Mode)`);
    return user;
  } else {
    // Firebase auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth!, email, password);
      const uid = userCredential.user.uid;
      
      // Fetch Firestore profile
      const userDocRef = doc(db!, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // If Firestore record doesn't exist but Firebase Auth succeeded, create default User role profile
        const defaultProfile: UserProfile = {
          uid,
          email: userCredential.user.email || email,
          displayName: userCredential.user.displayName || email.split('@')[0],
          role: "User",
          active: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, cleanUndefined(defaultProfile));
        setSessionUser(defaultProfile);
        await addFirebaseLog(uid, "Login", "Account logged in (Profile Auto-Created)");
        return defaultProfile;
      }
      
      const profile = { ...userDoc.data(), uid } as UserProfile;
      if (!profile.active) {
        await signOut(auth!);
        throw new Error("This account has been disabled by an Administrator.");
      }
      
      setSessionUser(profile);
      await addFirebaseLog(uid, "Login", `Account logged in successfully.`);
      return profile;
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      throw new Error(error.message || "Authentication failed. Please verify credentials.");
    }
  }
};

export const signOutUser = async () => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  if (activeUser) {
    if (isDemo) {
      addLocalLog(activeUser.uid, "Logout", "User logged out (Demo Mode)");
    } else {
      try {
        await addFirebaseLog(activeUser.uid, "Logout", "Account logged out");
        await signOut(auth!);
      } catch (err) {
        console.error("Sign out error", err);
      }
    }
  }
  setSessionUser(null);
};

export const forgotPassword = async (email: string): Promise<string> => {
  if (getIsDemoMode()) {
    const users = getLocalUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Email address not found in system.");
    return `Demo Mode: A simulated password reset link was sent to ${email}.`;
  } else {
    await sendPasswordResetEmail(auth!, email);
    return `Password reset email sent. Please check your inbox.`;
  }
};

export const signUpUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  designation: string = "", 
  department: string = ""
): Promise<UserProfile> => {
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered in system.");
    }
    const newProfile: UserProfile = {
      uid: "u-" + Date.now(),
      email,
      displayName,
      role: "User", // Default role is User
      designation,
      department,
      active: true,
      createdAt: new Date().toISOString()
    };
    users.push(newProfile);
    saveLocalUsers(users);
    setSessionUser(newProfile);
    addLocalLog(newProfile.uid, "Register", `New user registered: ${displayName} (Demo Mode)`);
    return newProfile;
  } else {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const uid = userCredential.user.uid;
      
      // Update profile in Auth
      await updateProfile(userCredential.user, { displayName });
      
      const newProfile: UserProfile = {
        uid,
        email,
        displayName,
        role: "User", // Default role is User
        designation,
        department,
        active: true,
        createdAt: new Date().toISOString()
      };
      
      // Write profile to Firestore
      const userDocRef = doc(db!, "users", uid);
      await setDoc(userDocRef, cleanUndefined(newProfile));
      
      setSessionUser(newProfile);
      await addFirebaseLog(uid, "Register", `New user registered profile: ${displayName}`);
      return newProfile;
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  }
};

// ==========================================
// LOCAL STORAGE CRUDS
// ==========================================

const getLocalUsers = (): UserProfile[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "users");
  return data ? JSON.parse(data) : [];
};

const saveLocalUsers = (users: UserProfile[]) => {
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "users", JSON.stringify(users));
};

const addLocalLog = (uid: string, action: string, details: string) => {
  const users = getLocalUsers();
  const user = users.find(u => u.uid === uid);
  const logsStr = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "logs") || "[]";
  const logs: ActivityLog[] = JSON.parse(logsStr);
  const newLog: ActivityLog = {
    id: "log-" + Date.now() + Math.random().toString(36).substr(2, 4),
    userId: uid,
    userName: user ? user.displayName : (uid === "system" ? "System Scheduler" : "Unknown User"),
    userEmail: user ? user.email : (uid === "system" ? "system@sbdiary.gov.lk" : ""),
    userRole: user ? user.role : "User",
    action,
    details,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "logs", JSON.stringify(logs));
};

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================

export const createUserProfile = async (
  profile: Omit<UserProfile, 'createdAt'>, 
  tempPassword?: string
): Promise<UserProfile> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  const newProfile: UserProfile = {
    ...profile,
    createdAt: new Date().toISOString()
  };
  
  if (isDemo) {
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === profile.email.toLowerCase())) {
      throw new Error("Email already registered in system.");
    }
    users.push(newProfile);
    saveLocalUsers(users);
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Create User", `Registered new user: ${profile.displayName} (${profile.role})`);
    }
    return newProfile;
  } else {
    // In Firebase, we add user record directly to the `users` Firestore collection.
    // To support real log-ins for newly created users: the Admin can add them to Firestore.
    // Standard Firebase Auth allows creating accounts. We write to Firestore.
    try {
      const userDocRef = doc(db!, "users", profile.uid || Date.now().toString());
      await setDoc(userDocRef, cleanUndefined(newProfile));
      
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Create User", `Registered new user profile: ${profile.displayName} (${profile.role})`);
      }
      return newProfile;
    } catch (err: any) {
      throw new Error(err.message || "Failed to create user in Firestore.");
    }
  }
};

export const updateUserProfile = async (profile: UserProfile): Promise<UserProfile> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    const users = getLocalUsers();
    const index = users.findIndex(u => u.uid === profile.uid);
    if (index === -1) throw new Error("User not found.");
    
    const oldRole = users[index].role;
    users[index] = profile;
    saveLocalUsers(users);
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Update User", `Updated user: ${profile.displayName} (Role: ${oldRole} -> ${profile.role})`);
    }
    return profile;
  } else {
    try {
      const userDocRef = doc(db!, "users", profile.uid);
      await setDoc(userDocRef, cleanUndefined(profile), { merge: true });
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Update User", `Updated user profile: ${profile.displayName} (${profile.role})`);
      }
      return profile;
    } catch (err: any) {
      throw new Error(err.message || "Failed to update Firestore user profile.");
    }
  }
};

export const deleteUserProfile = async (uid: string): Promise<string> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    const users = getLocalUsers();
    const userToDelete = users.find(u => u.uid === uid);
    if (!userToDelete) throw new Error("User not found.");
    
    const filtered = users.filter(u => u.uid !== uid);
    saveLocalUsers(filtered);
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Delete User", `Deleted user: ${userToDelete.displayName} (${userToDelete.email})`);
    }
    return uid;
  } else {
    try {
      // Get user name for logs
      const userDocRef = doc(db!, "users", uid);
      const snap = await getDoc(userDocRef);
      const name = snap.exists() ? snap.data().displayName : uid;
      
      await deleteDoc(userDocRef);
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Delete User", `Deleted user profile: ${name} (${uid})`);
      }
      return uid;
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete user from Firestore.");
    }
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (getIsDemoMode()) {
    return getLocalUsers();
  } else {
    try {
      const q = query(collection(db!, "users"));
      const querySnapshot = await getDocs(q);
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      return usersList;
    } catch (err) {
      console.error("Firestore error loading users, falling back to local list:", err);
      handleFirestoreError(err, OperationType.LIST, "users");
    }
  }
};

// ==========================================
// CALL UP ENTRIES (CRUD & ACTION WORKFLOWS)
// ==========================================

export const getEntries = async (): Promise<CallUpEntry[]> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  let entriesList: CallUpEntry[] = [];
  
  if (isDemo) {
    const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "entries");
    entriesList = data ? JSON.parse(data) : [];
  } else {
    try {
      if (activeUser && (activeUser.role === 'Admin' || activeUser.role === 'Super Admin')) {
        const q = query(collection(db!, "callup_entries"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          entriesList.push({ id: doc.id, ...doc.data() } as CallUpEntry);
        });
      } else if (activeUser) {
        // Query only entries that are assigned to this user or created by this user
        const q1 = query(collection(db!, "callup_entries"), where("responsibleOfficer", "==", activeUser.uid));
        const q2 = query(collection(db!, "callup_entries"), where("createdBy", "==", activeUser.uid));
        
        const [snap1, snap2] = await Promise.all([
          getDocs(q1).catch(err => handleFirestoreError(err, OperationType.LIST, "callup_entries")),
          getDocs(q2).catch(err => handleFirestoreError(err, OperationType.LIST, "callup_entries"))
        ]);
        
        const seenIds = new Set<string>();
        snap1.forEach((doc) => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            entriesList.push({ id: doc.id, ...doc.data() } as CallUpEntry);
          }
        });
        snap2.forEach((doc) => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            entriesList.push({ id: doc.id, ...doc.data() } as CallUpEntry);
          }
        });
      }
    } catch (err) {
      console.error("Firestore error loading entries, falling back to local:", err);
      const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "entries");
      entriesList = data ? JSON.parse(data) : [];
    }
  }
  
  // Security Filter: Regular User can only see entries they created or are assigned as Responsible Officer
  if (activeUser && activeUser.role === 'User') {
    entriesList = entriesList.filter(entry => {
      const uids = entry.responsibleOfficers || (entry.responsibleOfficer ? entry.responsibleOfficer.split(",") : []);
      return uids.includes(activeUser.uid) || entry.createdBy === activeUser.uid;
    });
  }
  
  return entriesList;
};

export const createEntry = async (entry: Omit<CallUpEntry, 'id' | 'recordNumber' | 'status'>): Promise<CallUpEntry> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  // Auto-generate record number based on current count
  const allEntries = await getEntries();
  const currentYear = new Date().getFullYear();
  const serialNo = (allEntries.length + 1).toString().padStart(4, '0');
  const recordNumber = `SBC/${currentYear}/${serialNo}`;
  
  // Status is automatically 'Pending'
  const newEntry: CallUpEntry = {
    ...entry,
    id: isDemo ? "entry-" + Date.now() : "", // Firestore will set document ID
    recordNumber,
    status: 'Pending',
    createdBy: activeUser ? activeUser.uid : "unknown",
    createdByName: activeUser ? activeUser.displayName : "Unknown",
    createdAt: new Date().toISOString()
  };
  
  if (isDemo) {
    const list = [...allEntries, newEntry];
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(list));
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Create Entry", `Created call up entry ${recordNumber} - Ref: ${entry.referenceNumber}`);
      
      // Generate automatic notification for newly assigned officers
      const uids = entry.responsibleOfficers || (entry.responsibleOfficer ? entry.responsibleOfficer.split(",") : []);
      for (const uid of uids) {
        if (uid && uid !== activeUser.uid) {
          await createNotification({
            title: "Document Assigned",
            message: `You have been assigned to: '${entry.subject}' (Ref: ${entry.referenceNumber}). Due Date: ${entry.dueDate}`,
            type: "info",
            targetUserId: uid
          });
        }
      }
    }
    return newEntry;
  } else {
    try {
      const docRef = doc(collection(db!, "callup_entries"));
      const finalizedEntry = { ...newEntry, id: docRef.id };
      await setDoc(docRef, cleanUndefined(finalizedEntry));
      
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Create Entry", `Created call up entry ${recordNumber} - Ref: ${entry.referenceNumber}`);
        
        // Notifications
        const uids = entry.responsibleOfficers || (entry.responsibleOfficer ? entry.responsibleOfficer.split(",") : []);
        for (const uid of uids) {
          if (uid && uid !== activeUser.uid) {
            await createNotification({
              title: "Document Assigned",
              message: `You have been assigned to: '${entry.subject}' (Ref: ${entry.referenceNumber}). Due Date: ${entry.dueDate}`,
              type: "info",
              targetUserId: uid
            });
          }
        }
      }
      return finalizedEntry;
    } catch (err: any) {
      throw new Error(err.message || "Failed to create entry in Firestore.");
    }
  }
};

export const updateEntry = async (entry: CallUpEntry): Promise<CallUpEntry> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Status rules:
  // If due date passes, auto overdue
  let status = entry.status;
  if (status !== 'Completed') {
    if (entry.dueDate < todayStr) {
      status = 'Overdue';
    } else if (status === 'Overdue') {
      status = 'Pending'; // Restored if due date is updated to future
    }
  }
  
  // If submission reference is entered, auto change to Completed
  if (entry.submissionReferenceNumber && entry.submissionReferenceNumber.trim() !== '') {
    status = 'Completed';
    entry.submissionDate = entry.submissionDate || todayStr;
    entry.submittedBy = entry.submittedBy || (activeUser ? activeUser.displayName : "Officer");
    entry.completedAt = entry.completedAt || new Date().toISOString();
    entry.completedBy = entry.completedBy || (activeUser ? activeUser.uid : "unknown");
    entry.completedByName = entry.completedByName || (activeUser ? activeUser.displayName : "Officer");
  }
  
  const updatedEntry: CallUpEntry = {
    ...entry,
    status,
    updatedBy: activeUser ? activeUser.uid : "unknown",
    updatedByName: activeUser ? activeUser.displayName : "Unknown",
    updatedAt: new Date().toISOString()
  };
  
  if (isDemo) {
    const list = await getEntries();
    const index = list.findIndex(e => e.id === entry.id);
    if (index === -1) throw new Error("Entry not found.");
    list[index] = updatedEntry;
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(list));
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Update Entry", `Updated call up entry ${entry.recordNumber} - Ref: ${entry.referenceNumber}`);
    }
    return updatedEntry;
  } else {
    try {
      const docRef = doc(db!, "callup_entries", entry.id);
      await setDoc(docRef, cleanUndefined(updatedEntry), { merge: true });
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Update Entry", `Updated call up entry ${entry.recordNumber} - Ref: ${entry.referenceNumber}`);
      }
      return updatedEntry;
    } catch (err: any) {
      throw new Error(err.message || "Failed to update entry in Firestore.");
    }
  }
};

export const completeEntry = async (
  id: string, 
  completionData: {
    submissionReferenceNumber: string;
    submissionDate: string;
    submittedBy: string;
    completionNotes: string;
    completionAttachment?: Attachment;
  }
): Promise<CallUpEntry> => {
  const list = await getEntries();
  const entry = list.find(e => e.id === id);
  if (!entry) throw new Error("Document entry not found.");
  
  const activeUser = getSessionUser();
  const updatedEntry: CallUpEntry = {
    ...entry,
    ...completionData,
    status: 'Completed',
    completedAt: new Date().toISOString(),
    completedBy: activeUser ? activeUser.uid : "unknown",
    completedByName: activeUser ? activeUser.displayName : "Unknown",
    updatedAt: new Date().toISOString(),
    updatedBy: activeUser ? activeUser.uid : "unknown"
  };
  
  if (getIsDemoMode()) {
    const index = list.findIndex(e => e.id === id);
    list[index] = updatedEntry;
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(list));
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Complete Entry", `Marked ${entry.recordNumber} as Completed. Submission Ref: ${completionData.submissionReferenceNumber}`);
      
      // Auto-create success notification
      await createNotification({
        title: "Action Item Completed",
        message: `${entry.recordNumber} has been successfully completed by ${activeUser.displayName}.`,
        type: "success"
      });
    }
    return updatedEntry;
  } else {
    try {
      const docRef = doc(db!, "callup_entries", id);
      await setDoc(docRef, cleanUndefined(updatedEntry), { merge: true });
      
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Complete Entry", `Marked ${entry.recordNumber} as Completed. Submission Ref: ${completionData.submissionReferenceNumber}`);
        
        await createNotification({
          title: "Action Item Completed",
          message: `${entry.recordNumber} has been successfully completed by ${activeUser.displayName}.`,
          type: "success"
        });
      }
      return updatedEntry;
    } catch (err: any) {
      throw new Error(err.message || "Failed to complete entry on Firestore.");
    }
  }
};

export const deleteEntry = async (id: string): Promise<string> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  const list = await getEntries();
  const entryToDelete = list.find(e => e.id === id);
  if (!entryToDelete) throw new Error("Entry not found.");
  
  if (isDemo) {
    const filtered = list.filter(e => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "entries", JSON.stringify(filtered));
    
    if (activeUser) {
      addLocalLog(activeUser.uid, "Delete Entry", `Deleted call up entry ${entryToDelete.recordNumber} - Ref: ${entryToDelete.referenceNumber}`);
    }
    return id;
  } else {
    try {
      await deleteDoc(doc(db!, "callup_entries", id));
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Delete Entry", `Deleted call up entry ${entryToDelete.recordNumber} - Ref: ${entryToDelete.referenceNumber}`);
      }
      return id;
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete entry from Firestore.");
    }
  }
};

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================

export const getNotifications = async (): Promise<SystemNotification[]> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  let notifList: SystemNotification[] = [];
  
  if (isDemo) {
    const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "notifications");
    notifList = data ? JSON.parse(data) : [];
  } else {
    try {
      if (activeUser && (activeUser.role === 'Admin' || activeUser.role === 'Super Admin')) {
        const q = query(collection(db!, "notifications"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          notifList.push({ id: doc.id, ...doc.data() } as SystemNotification);
        });
      } else if (activeUser) {
        // Query targeted notifications or general ones
        const q1 = query(collection(db!, "notifications"), where("targetUserId", "==", activeUser.uid));
        const q2 = query(collection(db!, "notifications"), where("targetUserId", "==", ""));
        
        const [snap1, snap2] = await Promise.all([
          getDocs(q1).catch(err => handleFirestoreError(err, OperationType.LIST, "notifications")),
          getDocs(q2).catch(err => handleFirestoreError(err, OperationType.LIST, "notifications"))
        ]);
        
        const seenIds = new Set<string>();
        snap1.forEach((doc) => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            notifList.push({ id: doc.id, ...doc.data() } as SystemNotification);
          }
        });
        snap2.forEach((doc) => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            notifList.push({ id: doc.id, ...doc.data() } as SystemNotification);
          }
        });
        
        // Sort manually by createdAt desc since we combined queries
        notifList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } catch (err) {
      console.error("Firestore error loading notifications, falling back to local:", err);
      const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "notifications");
      notifList = data ? JSON.parse(data) : [];
    }
  }
  
  // Filter for notifications specific to active user or general notifications
  if (activeUser) {
    notifList = notifList.filter(n => !n.targetUserId || n.targetUserId === activeUser.uid);
  }
  
  return notifList;
};

export const createNotification = async (notif: Omit<SystemNotification, 'id' | 'readBy' | 'createdAt'>): Promise<SystemNotification> => {
  const isDemo = getIsDemoMode();
  const newNotif: SystemNotification = {
    ...notif,
    targetUserId: notif.targetUserId || "",
    id: isDemo ? "notif-" + Date.now() + Math.random().toString(36).substr(2, 4) : "",
    readBy: [],
    createdAt: new Date().toISOString()
  };
  
  if (isDemo) {
    const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "notifications") || "[]";
    const list: SystemNotification[] = JSON.parse(data);
    list.unshift(newNotif);
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "notifications", JSON.stringify(list));
    return newNotif;
  } else {
    try {
      const docRef = doc(collection(db!, "notifications"));
      const finalized = { ...newNotif, id: docRef.id };
      await setDoc(docRef, cleanUndefined(finalized));
      return finalized;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "notifications");
    }
  }
};

export const markNotificationAsRead = async (id: string): Promise<string> => {
  const activeUser = getSessionUser();
  if (!activeUser) return id;
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "notifications") || "[]";
    const list: SystemNotification[] = JSON.parse(data);
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!list[index].readBy.includes(activeUser.uid)) {
        list[index].readBy.push(activeUser.uid);
        localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "notifications", JSON.stringify(list));
      }
    }
    return id;
  } else {
    try {
      const docRef = doc(db!, "notifications", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const notif = snap.data() as SystemNotification;
        if (!notif.readBy.includes(activeUser.uid)) {
          const updatedReadBy = [...notif.readBy, activeUser.uid];
          await updateDoc(docRef, cleanUndefined({ readBy: updatedReadBy }));
        }
      }
      return id;
    } catch (err) {
      console.error("Failed to mark notification as read in Firestore", err);
      return id;
    }
  }
};

// ==========================================
// SYSTEM ACTIVITY LOGS (ADMIN ONLY)
// ==========================================

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  if (getIsDemoMode()) {
    const logsStr = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "logs") || "[]";
    return JSON.parse(logsStr);
  } else {
    try {
      const q = query(collection(db!, "activity_logs"), orderBy("timestamp", "desc"), limit(500));
      const querySnapshot = await getDocs(q);
      const logsList: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      return logsList;
    } catch (err) {
      console.error("Firestore error loading logs, falling back to local:", err);
      const logsStr = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "logs") || "[]";
      return JSON.parse(logsStr);
    }
  }
};

const addFirebaseLog = async (uid: string, action: string, details: string) => {
  if (!uid || typeof uid !== "string") {
    console.warn("addFirebaseLog called with invalid or empty uid:", uid);
    return;
  }
  try {
    // Try to get user profile for full log details
    const userDoc = await getDoc(doc(db!, "users", uid));
    const profile = userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    
    const newLog: Omit<ActivityLog, 'id'> = {
      userId: uid,
      userName: profile ? profile.displayName : "Firebase User",
      userEmail: profile ? profile.email : "user@firebase.auth",
      userRole: profile ? profile.role : "User",
      action,
      details,
      timestamp: new Date().toISOString()
    };
    
    await addDoc(collection(db!, "activity_logs"), cleanUndefined(newLog));
  } catch (err) {
    console.error("Failed to write to activity_logs collection", err);
  }
};

// ==========================================
// SETTINGS
// ==========================================

export const getSystemSettings = async (): Promise<SystemSettings> => {
  if (getIsDemoMode()) {
    const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "settings");
    return data ? JSON.parse(data) : defaultSettings;
  } else {
    try {
      const docRef = doc(db!, "settings", "global");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SystemSettings;
      } else {
        // Create defaults in Firestore
        await setDoc(docRef, cleanUndefined(defaultSettings));
        return defaultSettings;
      }
    } catch (err) {
      console.error("Firestore loading settings error, falling back to local:", err);
      const data = localStorage.getItem(LOCAL_STORAGE_DB_PREFIX + "settings");
      return data ? JSON.parse(data) : defaultSettings;
    }
  }
};

export const saveSystemSettings = async (settings: SystemSettings): Promise<SystemSettings> => {
  const activeUser = getSessionUser();
  const isDemo = getIsDemoMode();
  
  if (isDemo) {
    localStorage.setItem(LOCAL_STORAGE_DB_PREFIX + "settings", JSON.stringify(settings));
    if (activeUser) {
      addLocalLog(activeUser.uid, "Update Settings", "Updated global organization settings and reminder thresholds.");
    }
    return settings;
  } else {
    try {
      const docRef = doc(db!, "settings", "global");
      await setDoc(docRef, cleanUndefined(settings), { merge: true });
      if (activeUser) {
        await addFirebaseLog(activeUser.uid, "Update Settings", "Updated global organization settings and reminder thresholds.");
      }
      return settings;
    } catch (err: any) {
      throw new Error(err.message || "Failed to update global settings in Firestore.");
    }
  }
};
