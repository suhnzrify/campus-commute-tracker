# Campus Commute Tracker Fix Progress

## Approved Plan Steps:
- [x] 1. Update src/lib/api.ts for local dev (env fallback to localhost:4000)
- [x] 2. Add /api/notifications routes to server/index.js
- [ ] 3. Migrate AdminDrivers.tsx, AdminStudents.tsx, AdminBuses.tsx to use React Query hooks (mutations added to hooks)
- [x] 3a. Add full CRUD mutations to src/hooks/useBuses.ts
  - [x] 3b. Migrate src/pages/admin/AdminStudents.tsx to useStudents hook
  - [x] 3c. Migrate src/pages/admin/AdminDrivers.tsx to useDrivers hook  

  - [x] 3d. Migrate src/pages/admin/AdminBuses.tsx to useBuses hook

- [x] 4. Verify/test DB data population (query counts)

- [x] 5. Run server and test all admin features

- [ ] 6. attempt_completion

**Current status:** All fixes complete - React Query integrated in admin pages, TS errors fixed. Ready for testing/production.

## Test Commands:
- Backend: `cd server && bun index.js`
- Frontend: `npm run dev`
- Login: adminlbscek@gmail.com / 1234
- Android: `npm run build_android`

