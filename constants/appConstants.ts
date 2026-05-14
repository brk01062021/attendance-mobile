export const USER_ROLES = {
    admin: 'ADMIN',
    teacher: 'TEACHER',
    parent: 'PARENT',
    student: 'STUDENT',
    principal: 'PRINCIPAL',
} as const;

export const ATTENDANCE_STATUS = {
    present: 'PRESENT',
    absent: 'ABSENT',
    late: 'LATE',
    halfDay: 'HALF_DAY',
} as const;

export const REPORT_RANGE_TYPES = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
} as const;

export const DISPLAY_RANGE_TYPES = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
} as const;

export const LEAVE_TYPES = {
    planned: 'PLANNED',
    unplanned: 'UNPLANNED',
} as const;

export const SCREEN_BACKGROUND_TYPE = {
    splashDark: 'splash-dark',
    splashGold: 'splash-gold',
} as const;
