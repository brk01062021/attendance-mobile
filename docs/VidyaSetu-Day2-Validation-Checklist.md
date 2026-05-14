# VidyaSetu Day 2 Validation Checklist

## Day 1 validation status

- Mobile repo contains commit: `VidyaSetu Day1 Step5 - frontend API constants cleanup`.
- Dashboard theme requirement is present in current files:
    - Admin dashboard uses splash-dark.
    - Teacher dashboard uses splash-dark.
    - Student dashboard uses splash-dark in dashboard/home mode.
    - Parent dashboard uses splash-dark in dashboard/home mode.
    - Login page is kept separate and unchanged in design direction.
    - Internal report/attendance/teacher-operation pages use splash-gold.
- TypeScript validation passes with `npx tsc --noEmit`.

## Day 2 cleanup completed in this package

- Consolidated frontend API constants into `src/constants/apiConfig.ts`.
- Updated `src/services/api.ts` to re-export the single source of truth.
- Preserved existing endpoint names used by current screens and services.
- Preserved backward-compatible analytics endpoint names.

## Day 2 manual test flow

1. Start backend on `http://localhost:8080` or update `DEFAULT_API_BASE_URL` in `src/constants/apiConfig.ts` to your LAN IP.
2. Start mobile app: `npm start` from `attendance-mobile`.
3. Confirm login screen design remains unchanged.
4. Confirm Admin, Teacher, Student, and Parent dashboards still show splash-dark.
5. Confirm these internal pages still show splash-gold:
    - Attendance
    - Date Summary
    - Admin Reports
    - Class Attendance Reports
    - Class-wise Attendance
    - Teacher Leave Planning
    - Teacher Replacements
    - Notifications
    - Create Notice
6. Validate API calls from:
    - Admin dashboard
    - Teacher dashboard
    - Attendance submit
    - Admin reports / analytics
    - Teacher replacement flow

## Git commands after replacing files

```powershell
cd C:\JavaProject\attendance-app\attendance-mobile
git status
git add src/constants/apiConfig.ts src/services/api.ts docs/VidyaSetu-Day2-Validation-Checklist.md
git commit -m "VidyaSetu Day2 API constants consolidation"
git push
```
