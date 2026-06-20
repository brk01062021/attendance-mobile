import { ClassTeacherPool } from '../types/timetable';

export type ClassOption = {
    className: string;
    label: string;
    sections: string[];
};

export const CLASS_OPTIONS: ClassOption[] = [
    { className: '1', label: 'Class 1', sections: ['A', 'B'] },
    { className: '2', label: 'Class 2', sections: ['A', 'B'] },
    { className: '3', label: 'Class 3', sections: ['A', 'B'] },
    { className: '4', label: 'Class 4', sections: ['A', 'B'] },
];

export const DEFAULT_CLASS_TEACHER_POOLS: ClassTeacherPool[] = [
    { poolId: 'TST2-POOL-1', poolName: 'Class 1 Teacher Pool', className: '1', teacherIds: [12, 1, 10, 8, 13, 5, 7], teacherNames: ['Ravi Chandra', 'Aruna Meka', 'Pooja Das', 'Madhav Singh', 'Suresh Kota', 'Eshwar Kumar', 'Lakshmi Gupta'] },
    { poolId: 'TST2-POOL-2', poolName: 'Class 2 Teacher Pool', className: '2', teacherIds: [6, 3, 4, 15, 2, 11, 14], teacherNames: ['Farah Khan', 'Chandra Rao', 'Deepa Nair', 'Zoya Bose', 'Bhavana Reddy', 'Qureshi Rahman', 'Yamini Shetty'] },
    { poolId: 'TST2-POOL-3', poolName: 'Class 3 Teacher Pool', className: '3', teacherIds: [12, 1, 10, 8, 13, 5, 7], teacherNames: ['Ravi Chandra', 'Aruna Meka', 'Pooja Das', 'Madhav Singh', 'Suresh Kota', 'Eshwar Kumar', 'Lakshmi Gupta'] },
    { poolId: 'TST2-POOL-4', poolName: 'Class 4 Teacher Pool', className: '4', teacherIds: [6, 3, 4, 15, 2, 11, 14], teacherNames: ['Farah Khan', 'Chandra Rao', 'Deepa Nair', 'Zoya Bose', 'Bhavana Reddy', 'Qureshi Rahman', 'Yamini Shetty'] },
];

export const EXCEL_POOL_TABS = ['TeacherPools', 'TeacherAssignments', 'Subjects', 'ClassSections'];
