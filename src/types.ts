export type UserRole = 'Super Admin' | 'Admin' | 'User';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  designation?: string;
  department?: string;
  active: boolean;
  createdAt: string;
}

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';
export type EntryStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface Attachment {
  name: string;
  url: string;
  type: 'pdf' | 'word' | 'excel' | 'image' | 'other';
  size?: string;
}

export interface CallUpEntry {
  id: string;
  recordNumber: string; // Auto-generated e.g., SBC-2026-0001
  referenceNumber: string;
  subject: string;
  letterType: string;
  description: string;
  dateReceived: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  responsibleOfficer: string; // User uid or name
  responsibleOfficerName?: string;
  responsibleOfficers?: string[];
  responsibleOfficerNames?: string[];
  officeInstitution: string;
  submissionLocation: string;
  priority: PriorityLevel;
  status: EntryStatus;
  remarks: string;
  attachments: Attachment[];
  
  // Creation/Modification
  createdBy: string; // User uid
  createdByName?: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;

  // Completion fields
  submissionReferenceNumber?: string;
  submissionDate?: string; // YYYY-MM-DD
  submittedBy?: string;
  completionNotes?: string;
  completedAt?: string;
  completedBy?: string; // User uid
  completedByName?: string;
  completionAttachment?: Attachment;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: string; // e.g. "Create Entry", "Update Entry", "Complete Entry", "Login"
  details: string; // Human readable description
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetUserId?: string; // If specific user, otherwise general/admin
  readBy: string[]; // List of user uids who read it
  createdAt: string;
  link?: string; // route link
}

export interface SystemSettings {
  organizationName: string;
  organizationLogo: string; // base64 or url
  emailNotifications: boolean;
  reminderDaysBefore: number; // e.g. 3 days
}

// English and Sinhala Translations Dictionary
export const translations = {
  en: {
    appTitle: "SB Call Up Diary",
    appSubTitle: "Official Document & Action Tracking System",
    govLabel: "Democratic Socialist Republic of Sri Lanka",
    dashboard: "Dashboard",
    pendingItems: "Pending Items",
    completedItems: "Completed Items",
    allRecords: "All Records",
    calendarView: "Calendar View",
    reports: "Reports",
    notifications: "Notifications",
    usersManagement: "Users Management",
    activityLogs: "Activity Logs",
    settings: "Settings",
    login: "Login",
    logout: "Logout",
    signUp: "Sign Up",
    register: "Register",
    alreadyHaveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    createAccount: "Create Account",
    displayName: "Full Name",
    email: "Email Address",
    password: "Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    signIn: "Sign In",
    demoMode: "Demo / Sandbox Mode",
    demoModeDesc: "Interact instantly with pre-seeded government-style logs, calendars, and dashboards without manual Firebase configuration.",
    superAdmin: "Super Admin",
    admin: "Admin",
    user: "User",
    profile: "Profile",
    role: "Role",
    status: "Status",
    priority: "Priority",
    search: "Search",
    filter: "Filter",
    createEntry: "Create New Entry",
    editEntry: "Edit Entry",
    deleteEntry: "Delete Entry",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    recordNumber: "Record No",
    refNumber: "Reference Number",
    subject: "Subject",
    letterType: "Letter Type",
    description: "Description",
    dateReceived: "Date Received",
    dueDate: "Due Date",
    responsibleOfficer: "Responsible Officer",
    officeInstitution: "Office / Institution",
    submissionLocation: "Submission Location",
    remarks: "Remarks",
    attachments: "Attachments",
    addAttachment: "Add Attachment",
    completedBy: "Completed By",
    completedAt: "Completed At",
    submissionRef: "Submission Ref No",
    submissionDate: "Submission Date",
    submittedBy: "Submitted By",
    completionNotes: "Completion Notes",
    markCompleted: "Mark Completed",
    daysRemaining: "Days Remaining",
    overdue: "Overdue",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
    totalRecords: "Total Records",
    totalUsers: "Total Users",
    dueToday: "Due Today",
    dueThisWeek: "Due This Week",
    statistics: "Statistics",
    activityLogTable: "Activity Log",
    userTable: "User Management",
    action: "Action",
    userEmail: "User Email",
    userName: "User Name",
    time: "Time",
    details: "Details",
    noRecords: "No records found.",
    sinhala: "සිංහල",
    english: "English",
    unauthorized: "Unauthorized Access",
    noPermission: "You do not have permission to view this section.",
    welcomeBack: "Welcome back",
    assignedToMe: "Assigned To Me",
    allDepartment: "All Departments",
    allOfficers: "All Officers",
    days: "days",
    day: "day",
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    organizationName: "Organization Name",
    organizationLogo: "Organization Logo",
    emailNotificationsToggle: "Enable Email Notifications",
    reminderDaysConfig: "Reminder Warning Threshold (Days)",
    saveSettingsSuccess: "Settings saved successfully!",
    generateReport: "Generate Report",
    pendingReport: "Pending Items Report",
    completedReport: "Completed Items Report",
    overdueReport: "Overdue Items Report",
    monthlyReport: "Monthly Performance Report",
    userPerformanceReport: "Officer Performance Report",
    exportPdf: "Export as PDF",
    exportExcel: "Export as Excel",
    printFriendly: "Print Friendly Layout",
    createUser: "Create New User",
    editUser: "Edit User",
    disableUser: "Disable User",
    enableUser: "Enable User",
    resetUserPassword: "Reset Password",
    deleteUser: "Delete User",
    designation: "Designation",
    department: "Department",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    activeItems: "Active Items",
    daysLeft: "days left",
    overdueBy: "overdue by",
    dueWithin3Days: "Due within 3 days",
    official: "Official Letter",
    confidential: "Confidential Document",
    circular: "Circular / Directive",
    normal: "General Correspondence",
  },
  si: {
    appTitle: "SB ඇමතුම් දිනපොත",
    appSubTitle: "නිල ලේඛන සහ කාර්යයන් නිරීක්ෂණ පද්ධතිය",
    govLabel: "ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය",
    dashboard: "පාලන පුවරුව",
    pendingItems: "නියමිත කාර්යයන්",
    completedItems: "නිම කළ කාර්යයන්",
    allRecords: "සියලුම වාර්තා",
    calendarView: "දිනදර්ශන දසුන",
    reports: "වාර්තා ලබාගැනීම",
    notifications: "නිවේදන",
    usersManagement: "පරිශීලක කළමනාකරණය",
    activityLogs: "පද්ධති සටහන්",
    settings: "සැකසුම්",
    login: "ප්‍රවේශ වන්න",
    logout: "පද්ධතියෙන් ඉවත් වන්න",
    signUp: "ලියාපදිංචි වන්න",
    register: "ලියාපදිංචි වීම",
    alreadyHaveAccount: "දැනටමත් ගිණුමක් තිබේද?",
    noAccount: "ගිණුමක් නොමැතිද?",
    createAccount: "ගිණුමක් සාදන්න",
    displayName: "සම්පූර්ණ නම",
    email: "විද්‍යුත් තැපැල් ලිපිනය",
    password: "මුරපදය",
    forgotPassword: "මුරපදය අමතකද?",
    resetPassword: "මුරපදය යළි සැකසීම",
    signIn: "ඇතුළු වන්න",
    demoMode: "ප්‍රදර්ශන මාදිලිය (Demo Mode)",
    demoModeDesc: "ෆයර්බේස් වින්‍යාසයකින් තොරව, පද්ධතිය පරීක්ෂා කිරීම සඳහා සකස් කළ රාජ්‍ය මට්ටමේ දත්ත සමඟින් සෘජුවම ඇතුළු වන්න.",
    superAdmin: "ප්‍රධාන පරිපාලක (Super Admin)",
    admin: "පරිපාලක (Admin)",
    user: "පරිශීලක (User)",
    profile: "පරිශීලක විස්තර",
    role: "තනතුර / භූමිකාව",
    status: "තත්ත්වය",
    priority: "ප්‍රමුඛතාවය",
    search: "සෙවීම",
    filter: "පෙරහන්",
    createEntry: "නව සටහනක් එක් කරන්න",
    editEntry: "සටහන සංස්කරණය",
    deleteEntry: "සටහන මකා දමන්න",
    save: "සුරකින්න",
    cancel: "අවලංගු කරන්න",
    confirm: "තහවුරු කරන්න",
    recordNumber: "වාර්තා අංකය",
    refNumber: "යොමු අංකය",
    subject: "විෂයය",
    letterType: "ලිපි වර්ගය",
    description: "විස්තරය",
    dateReceived: "ලැබුණු දිනය",
    dueDate: "නියමිත අවසන් දිනය",
    responsibleOfficer: "වගකිවයුතු නිලධාරියා",
    officeInstitution: "කාර්යාලය / ආයතනය",
    submissionLocation: "භාරදිය යුතු ස්ථානය",
    remarks: "විශේෂ සටහන්",
    attachments: "ඇමුණුම්",
    addAttachment: "ඇමුණුමක් එක් කරන්න",
    completedBy: "නිම කරන ලද්දේ",
    completedAt: "නිම කළ දිනය",
    submissionRef: "භාරදුන් යොමු අංකය",
    submissionDate: "භාරදුන් දිනය",
    submittedBy: "භාරදෙන ලද්දේ",
    completionNotes: "නිම කිරීමේ සටහන්",
    markCompleted: "නිම කළ බව සලකුණු කරන්න",
    daysRemaining: "ඉතිරි දින ගණන",
    overdue: "කාලය ඉක්මවූ",
    pending: "නියමිත",
    inProgress: "ක්‍රියාත්මක වෙමින් පවතින",
    completed: "නිම කළ",
    low: "අඩු",
    medium: "මධ්‍යම",
    high: "වැඩි",
    urgent: "අත්‍යවශ්‍ය",
    totalRecords: "මුළු වාර්තා ගණන",
    totalUsers: "මුළු පරිශීලකයින්",
    dueToday: "අද දිනට නියමිත",
    dueThisWeek: "මේ සතියේ නියමිත",
    statistics: "සංඛ්‍යාලේඛන",
    activityLogTable: "ක්‍රියාකාරකම් සටහන",
    userTable: "පරිශීලක කළමනාකරණය",
    action: "ක්‍රියාව",
    userEmail: "පරිශීලක විද්‍යුත් තැපෑල",
    userName: "පරිශීලක නම",
    time: "වේලාව",
    details: "විස්තර",
    noRecords: "කිසිදු වාර්තාවක් හමු නොවිය.",
    sinhala: "සිංහල",
    english: "English",
    unauthorized: "අනවසර ප්‍රවේශයකි",
    noPermission: "මෙම අංශය බැලීමට ඔබට අවසර නොමැත.",
    welcomeBack: "සාදරයෙන් පිළිගනිමු",
    assignedToMe: "මට පැවරුණු කාර්යයන්",
    allDepartment: "සියලුම දෙපාර්තමේන්තු",
    allOfficers: "සියලුම නිලධාරීන්",
    days: "දින",
    day: "දින",
    today: "අද",
    tomorrow: "හෙට",
    yesterday: "ඊයේ",
    language: "භාෂාව",
    theme: "තේමාව",
    light: "ලා පැහැති",
    dark: "තද පැහැති",
    organizationName: "ආයතනයේ නම",
    organizationLogo: "ආයතන ලාංඡනය",
    emailNotificationsToggle: "විද්‍යුත් තැපැල් දැනුම්දීම් සක්‍රීය කරන්න",
    reminderDaysConfig: "මතක් කිරීම් දින සීමාව",
    saveSettingsSuccess: "සැකසුම් සාර්ථකව සුරකින ලදී!",
    generateReport: "වාර්තාව සකසන්න",
    pendingReport: "නියමිත කාර්යයන් පිළිබඳ වාර්තාව",
    completedReport: "නිම කළ කාර්යයන් පිළිබඳ වාර්තාව",
    overdueReport: "කාලය ඉක්මවූ කාර්යයන් පිළිබඳ වාර්තාව",
    monthlyReport: "මාසික කාර්ය සාධන වාර්තාව",
    userPerformanceReport: "නිලධාරී කාර්ය සාධන වාර්තාව",
    exportPdf: "PDF ලෙස බාගත කරන්න",
    exportExcel: "Excel ලෙස බාගත කරන්න",
    printFriendly: "මුද්‍රණයට සුදුසු දසුන",
    createUser: "නව පරිශීලකයෙකු සාදන්න",
    editUser: "පරිශීලක සංස්කරණය",
    disableUser: "පරිශීලක අක්‍රීය කරන්න",
    enableUser: "පරිශීලක සක්‍රීය කරන්න",
    resetUserPassword: "මුරපදය යළි සකසන්න",
    deleteUser: "පරිශීලක මකා දමන්න",
    designation: "තනතුර",
    department: "දෙපාර්තමේන්තුව / අංශය",
    activeStatus: "සක්‍රීය",
    inactiveStatus: "අක්‍රීය",
    activeItems: "සක්‍රීය කාර්යයන්",
    daysLeft: "දින ඉතිරියි",
    overdueBy: "පමාවූ දින ගණන",
    dueWithin3Days: "දින 3ක් ඇතුළත නියමිත",
    official: "නිල ලිපිය",
    confidential: "රහස්‍ය ලේඛනය",
    circular: "චක්‍රලේඛය / උපදෙස් මාලාව",
    normal: "සාමාන්‍ය ලිපි",
  }
};
