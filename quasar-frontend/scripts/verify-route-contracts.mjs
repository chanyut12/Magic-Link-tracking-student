import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routesFile = join(process.cwd(), 'src', 'router', 'routes.ts');
const content = readFileSync(routesFile, 'utf8');

const requiredRouteChecks = [
  { label: 'home route', pattern: /path:\s*''[\s\S]*pages\/MainPage\.vue/ },
  { label: 'dashboard route', pattern: /path:\s*'dashboard'[\s\S]*pages\/IndexPage\.vue/ },
  { label: 'students route', pattern: /path:\s*'students'[\s\S]*pages\/StudentsPage\.vue/ },
  { label: 'student self route', pattern: /path:\s*'my-attendance'[\s\S]*pages\/StudentInformationPage\.vue/ },
  { label: 'attendance route', pattern: /path:\s*'attendance'[\s\S]*pages\/AttendancePage\.vue/ },
  { label: 'attendance dashboard route', pattern: /path:\s*'attendance-dashboard'[\s\S]*pages\/AttendanceDashboardPage\.vue/ },
  { label: 'create route', pattern: /path:\s*'create'[\s\S]*pages\/CreateTaskPage\.vue/ },
  { label: 'login links route', pattern: /path:\s*'login-links'[\s\S]*pages\/LoginLinksPage\.vue/ },
  { label: 'task detail route', pattern: /path:\s*'task-detail\/:taskId'[\s\S]*pages\/TaskDetailPage\.vue/ },
  { label: 'task guest route', pattern: /path:\s*'task\/:token'[\s\S]*pages\/TaskGuestPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'task delegate route', pattern: /path:\s*'task\/:token\/delegate'[\s\S]*pages\/DelegatePage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'task report route', pattern: /path:\s*'task\/:token\/report'[\s\S]*pages\/ReportPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'success route', pattern: /path:\s*'task\/:token\/success'[\s\S]*pages\/SuccessPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'expired route', pattern: /path:\s*'task\/:token\/expired'[\s\S]*pages\/ExpiredPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'locked route', pattern: /path:\s*'task\/:token\/locked'[\s\S]*pages\/LockedPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'magic login route', pattern: /path:\s*'login\/magic\/:token'[\s\S]*pages\/MagicLoginPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'admin access route', pattern: /path:\s*'admin-access'[\s\S]*pages\/AdminAccessPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: 'forbidden route', pattern: /path:\s*'forbidden'[\s\S]*pages\/ForbiddenPage\.vue[\s\S]*hideNav:\s*true/ },
  { label: '404 catch-all route', pattern: /path:\s*'\/:catchAll\(\.\*\)\*'[\s\S]*pages\/ErrorNotFound\.vue/ },
];

const failures = requiredRouteChecks
  .filter((check) => !check.pattern.test(content))
  .map((check) => check.label);

if (failures.length > 0) {
  console.log('[fail] Route contract verification');
  failures.forEach((failure) => {
    console.log(`  - Missing or changed: ${failure}`);
  });
  process.exitCode = 1;
} else {
  console.log('Frontend route contract verification passed.');
}
