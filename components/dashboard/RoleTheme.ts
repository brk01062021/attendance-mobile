import { DashboardRole } from './roleMenus';

export const getRoleAccent = (role: DashboardRole) => {
    switch (role) {
        case 'ADMIN':
            return '#D7A84F';
        case 'PRINCIPAL':
            return '#F0C75E';
        case 'TEACHER':
            return '#70D6A3';
        case 'STUDENT':
            return '#7DB7FF';
        case 'PARENT':
            return '#F7A6C1';
        default:
            return '#D7A84F';
    }
};

export default getRoleAccent;
