export function resolveSchoolName(schoolId?: string, existingName?: string) {
 const normalized = String(schoolId || '').toUpperCase();
 if (existingName && existingName !== 'VidyaSetu Demo School') return existingName;
 if (normalized === 'BRK1') return 'BRK International School';
 if (normalized === 'TST1') return 'First test school';
 if (normalized === 'TST2') return 'Second test school';
 if (normalized === 'TST3') return 'Third test school';
 return existingName || `${normalized || 'Demo'} School`;
}
