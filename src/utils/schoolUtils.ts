export function resolveSchoolName(schoolId?: string, existingName?: string) {
 const normalized = String(schoolId || '').toUpperCase();
 if (existingName && existingName !== 'VidyaSetu Demo School') return existingName;
 if (normalized === 'BRK1') return 'BRK International School';
 return existingName || `${normalized || 'Demo'} School`;
}
