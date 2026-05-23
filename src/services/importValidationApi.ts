import { api } from './api';
import { getSession, normalizeSchoolId } from './sessionService';

export type ImportSheetPreview = {
  sheetName: string;
  totalRows: number;
  headers: string[];
};

export type ImportValidationIssue = {
  sheetName: string;
  rowNumber: number;
  fieldName: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
};

export type ImportPreviewResponse = {
  schoolId: string;
  importType: string;
  fileName: string;
  valid: boolean;
  tenantSafe: boolean;
  status: string;
  summary: string;
  rowCounts: Record<string, number>;
  previewSheets: ImportSheetPreview[];
  issues: ImportValidationIssue[];
  previewedAt: string;
};

export async function validateImportPreview(sheets: ImportSheetPreview[], fileName = 'pilot-school-master.xlsx') {
  const session = getSession();
  const schoolId = normalizeSchoolId(session?.schoolId);
  const role = session?.role || 'ADMIN';
  const response = await api.post('/imports/preview/validate', {
    schoolId,
    importType: 'MASTER_WORKBOOK',
    fileName,
    requestedByRole: role,
    sheets,
  }, {
    headers: {
      'X-School-Id': schoolId,
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
  });
  return (response.data?.data || response.data) as ImportPreviewResponse;
}

export const day28SampleSheets: ImportSheetPreview[] = [
  { sheetName: 'SchoolProfile', totalRows: 1, headers: ['school_id', 'school_name', 'academic_year'] },
  { sheetName: 'Students', totalRows: 300, headers: ['admission_no', 'student_name', 'class_name', 'section'] },
  { sheetName: 'Parents', totalRows: 300, headers: ['admission_no', 'parent_name', 'mobile'] },
  { sheetName: 'Teachers', totalRows: 30, headers: ['teacher_id', 'teacher_name', 'mobile'] },
  { sheetName: 'TeacherAssignments', totalRows: 90, headers: ['teacher_id', 'class_name', 'section', 'subject'] },
  { sheetName: 'Subjects', totalRows: 20, headers: ['subject_name', 'subject_type', 'weekly_periods'] },
  { sheetName: 'ClassSections', totalRows: 20, headers: ['class_name', 'section'] },
  { sheetName: 'TeacherPools', totalRows: 10, headers: ['class_name', 'teacher_pool'] },
  { sheetName: 'Schedules', totalRows: 40, headers: ['day', 'period', 'start_time', 'end_time'] },
];
