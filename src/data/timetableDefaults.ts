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
    { className: '5', label: 'Class 5', sections: ['A', 'B'] },
    { className: '6', label: 'Class 6', sections: ['A', 'B', 'C'] },
    { className: '7', label: 'Class 7', sections: ['A', 'B', 'C'] },
    { className: '8', label: 'Class 8', sections: ['A', 'B', 'C'] },
    { className: '9', label: 'Class 9', sections: ['A', 'B', 'C'] },
    { className: '10', label: 'Class 10', sections: ['A', 'B', 'C'] },
];

export const DEFAULT_CLASS_TEACHER_POOLS: ClassTeacherPool[] = [
    { poolId: 'POOL-1', poolName: 'Pool 1 • Class 1 Teachers', className: '1', teacherIds: [101, 102, 103, 104], teacherNames: ['Lakshmi', 'Suresh', 'Anitha', 'Ravi'] },
    { poolId: 'POOL-2', poolName: 'Pool 2 • Class 2 Teachers', className: '2', teacherIds: [201, 202, 203, 204], teacherNames: ['Prasad', 'Meena', 'Kiran', 'Jyothi'] },
    { poolId: 'POOL-3', poolName: 'Pool 3 • Class 3 Teachers', className: '3', teacherIds: [301, 302, 303, 304], teacherNames: ['Vamsi', 'Divya', 'Arun', 'Rupa'] },
    { poolId: 'POOL-4', poolName: 'Pool 4 • Class 4 Teachers', className: '4', teacherIds: [401, 402, 403, 404], teacherNames: ['Kavitha', 'Naveen', 'Bhanu', 'Ramesh'] },
    { poolId: 'POOL-5', poolName: 'Pool 5 • Class 5 Teachers', className: '5', teacherIds: [501, 502, 503, 504], teacherNames: ['Geetha', 'Mahesh', 'Sunitha', 'Harsha'] },
    { poolId: 'POOL-6', poolName: 'Pool 6 • Class 6 Teachers', className: '6', teacherIds: [601, 602, 603, 604, 605], teacherNames: ['Ravi Kumar', 'Anitha Reddy', 'Sailaja', 'Mohan', 'Fatima'] },
    { poolId: 'POOL-7', poolName: 'Pool 7 • Class 7 Teachers', className: '7', teacherIds: [701, 702, 703, 704, 705], teacherNames: ['Rohit', 'Sana', 'Deepak', 'Pooja', 'Gopi'] },
    { poolId: 'POOL-8', poolName: 'Pool 8 • Class 8 Teachers', className: '8', teacherIds: [801, 802, 803, 804, 805], teacherNames: ['Swathi', 'Naresh', 'Priya', 'Varun', 'Madhavi'] },
    { poolId: 'POOL-9', poolName: 'Pool 9 • Class 9 Teachers', className: '9', teacherIds: [901, 902, 903, 904, 905], teacherNames: ['Rajesh', 'Sirisha', 'Vikram', 'Keerthi', 'Imran'] },
    { poolId: 'POOL-10', poolName: 'Pool 10 • Class 10 Teachers', className: '10', teacherIds: [1001, 1002, 1003, 1004, 1005], teacherNames: ['Ravi Kumar', 'Anitha Reddy', 'John Paul', 'Madhavi', 'Srinivas'] },
];

export const EXCEL_POOL_TABS = ['TeacherPools', 'TeacherAssignments', 'Subjects', 'ClassSections'];
