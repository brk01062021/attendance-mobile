export type DashboardRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type DashboardMenuConfig = {
    label: string;
    route?: string;
    icon: string;
    description?: string;
    action?: 'register' | 'logout';
};

export const roleMenus: Record<DashboardRole, DashboardMenuConfig[]> = {
    ADMIN: [
        { icon: '🏠', label: 'Home', route: '/admin-dashboard', description: 'Admin command center' },
        { icon: '🧠', label: 'School Intelligence', route: '/principal-dashboard?sourceRole=admin&role=ADMIN', description: 'Executive insights' },
        { icon: '✅', label: 'Take Attendance', route: '/home?sourceRole=admin&role=ADMIN', description: 'Class attendance flow' },
        { icon: '📊', label: 'Attendance Reports', route: '/attendance-report?role=ADMIN&sourceRole=admin', description: 'School reports' },
        { icon: '👨‍🏫', label: 'Teacher Reports', route: '/admin-teacher-dashboard?sourceRole=admin&role=ADMIN', description: 'Teacher performance and leave' },
        { icon: '🗓️', label: 'Teacher Leave Planning', route: '/admin-leave-approvals?role=ADMIN&sourceRole=admin', description: 'Leave and replacement approvals' },
        { icon: '🧩', label: 'Teacher Assignments', route: '/teacher-assignments?sourceRole=admin&role=ADMIN', description: 'Subject and class mapping' },
        { icon: '🕒', label: 'Generate Timetable', route: '/generate-timetable?role=ADMIN&sourceRole=admin', description: 'Auto timetable engine' },
        { icon: '🗂️', label: 'Timetable Batch Center', route: '/timetable-batch-center?role=ADMIN&sourceRole=admin', description: 'Use, publish, export batches' },
        { icon: '🔒', label: 'Timetable Operations', route: '/timetable-operations?role=ADMIN&sourceRole=admin', description: 'Publish lock, exports, live views' },
        { icon: '📝', label: 'Register Here', action: 'register', description: 'Teacher, student, parent' },
        { icon: '📥', label: 'Import School Data', route: '/import-school-data?sourceRole=admin&role=ADMIN', description: 'Excel onboarding engine' },
        { icon: '📣', label: 'Create School Notice', route: '/create-school-notice?sourceRole=admin&role=ADMIN', description: 'Announcements and alerts' },
    ],
    PRINCIPAL: [
        { icon: '🏠', label: 'Home', route: '/principal-home', description: 'Principal command center' },
        { icon: '🧠', label: 'School Intelligence', route: '/principal-dashboard?sourceRole=principal&role=PRINCIPAL', description: 'Executive insights' },
        { icon: '✅', label: 'Take Attendance', route: '/home?sourceRole=principal&role=PRINCIPAL', description: 'Operational support' },
        { icon: '📊', label: 'Attendance Reports', route: '/attendance-report?role=PRINCIPAL&sourceRole=principal', description: 'School attendance reports' },
        { icon: '👨‍🏫', label: 'Teacher Reports', route: '/admin-teacher-dashboard?sourceRole=principal&role=PRINCIPAL', description: 'Teacher workload and reports' },
        { icon: '🗓️', label: 'Teacher Leave Planning', route: '/admin-leave-approvals?role=PRINCIPAL&sourceRole=principal', description: 'Leave approvals for Principal' },
        { icon: '🧩', label: 'Teacher Assignments', route: '/teacher-assignments?sourceRole=principal&role=PRINCIPAL', description: 'Subject and class mapping' },
        { icon: '🕒', label: 'Generate Timetable', route: '/generate-timetable?role=PRINCIPAL&sourceRole=principal', description: 'Auto timetable engine' },
        { icon: '🗂️', label: 'Timetable Batch Center', route: '/timetable-batch-center?role=PRINCIPAL&sourceRole=principal', description: 'Use, publish, export batches' },
        { icon: '🔒', label: 'Timetable Operations', route: '/timetable-operations?role=PRINCIPAL&sourceRole=principal', description: 'Publish lock, exports, live views' },
        { icon: '📝', label: 'Register Here', action: 'register', description: 'Teacher, student, parent' },
        { icon: '📥', label: 'Import School Data', route: '/import-school-data?sourceRole=principal&role=PRINCIPAL', description: 'Excel onboarding engine' },
        { icon: '📣', label: 'Create School Notice', route: '/create-school-notice?sourceRole=principal&role=PRINCIPAL', description: 'Announcements and alerts' },
    ],
    TEACHER: [
        { icon: '🏠', label: 'Dashboard', route: '/teacher-dashboard', description: 'Teacher workspace' },
        { icon: '✅', label: 'Take Attendance', route: '/home?sourceRole=teacher&role=TEACHER', description: 'Mark class attendance' },
        { icon: '📅', label: 'Date Summary', route: '/date-summary?sourceRole=teacher&role=TEACHER', description: 'Daily attendance summary' },
        { icon: '📊', label: 'Attendance Reports', route: '/attendance-report?role=TEACHER&sourceRole=teacher', description: 'Class records' },
        { icon: '📝', label: 'Request Leave / Leave Enquiry', route: '/teacher-leave-request?role=TEACHER&sourceRole=teacher', description: 'Submit leave enquiry for approval' },
        { icon: '🔁', label: 'Replacement Duties', route: '/teacher-replacements?sourceRole=teacher&role=TEACHER', description: 'Assigned replacement periods' },
        { icon: '🕒', label: 'Live Timetable', route: '/timetable-live?role=TEACHER&sourceRole=teacher', description: 'Published teaching schedule' },
    ],
    STUDENT: [
        { icon: '🏠', label: 'Dashboard', route: '/student-dashboard', description: 'Student overview' },
        { icon: '📊', label: 'Attendance', route: '/attendance-report?role=STUDENT&sourceRole=student', description: 'Attendance records' },
        { icon: '📣', label: 'Notices', route: '/notifications?sourceRole=student&role=STUDENT', description: 'School updates' },
        { icon: '🕒', label: 'Live Timetable', route: '/timetable-live?role=STUDENT&sourceRole=student', description: 'Published class schedule' },
    ],
    PARENT: [
        { icon: '🏠', label: 'Dashboard', route: '/parent-dashboard', description: 'Child overview' },
        { icon: '📊', label: 'Attendance', route: '/attendance-report?role=PARENT&sourceRole=parent', description: 'Child attendance reports' },
        { icon: '📣', label: 'Notices', route: '/notifications?sourceRole=parent&role=PARENT', description: 'School updates' },
        { icon: '🕒', label: 'Child Timetable', route: '/timetable-live?role=PARENT&sourceRole=parent', description: 'Published class schedule' },
    ],
};
