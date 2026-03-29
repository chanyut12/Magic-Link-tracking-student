import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

const files = {
  quasarConfig: readFileSync(join(rootDir, 'quasar.config.ts'), 'utf8'),
  useAuthSession: readFileSync(join(rootDir, 'src', 'composables', 'useAuthSession.ts'), 'utf8'),
  useUserStore: readFileSync(join(rootDir, 'src', 'composables', 'useUserStore.ts'), 'utf8'),
  useAttendanceFilters: readFileSync(join(rootDir, 'src', 'composables', 'useAttendanceFilters.ts'), 'utf8'),
  useCaseNotifications: readFileSync(join(rootDir, 'src', 'composables', 'useCaseNotifications.ts'), 'utf8'),
};

const failures = [];

function assertPattern(label, content, pattern) {
  if (!pattern.test(content)) {
    failures.push(label);
  }
}

assertPattern(
  'pinia boot file is not registered',
  files.quasarConfig,
  /boot:\s*\[\s*'pinia',\s*'axios'\s*\]/,
);
assertPattern(
  'auth session composable is not backed by Pinia',
  files.useAuthSession,
  /useAuthSessionStore\(getAppPinia\(\)\)/,
);
assertPattern(
  'user store composable no longer layers on shared auth session state',
  files.useUserStore,
  /const\s*\{\s*[\s\S]*loadSession,[\s\S]*\}\s*=\s*useAuthSession\(\);/,
);
assertPattern(
  'attendance filters are not using lookup cache store',
  files.useAttendanceFilters,
  /useAttendanceLookupStore\(\)/,
);
assertPattern(
  'attendance filters still call lookup service directly',
  files.useAttendanceFilters,
  /lookupStore\.get(Schools|Locations|GradeLevels|Rooms)\(/,
);
assertPattern(
  'case notifications composable is not backed by Pinia',
  files.useCaseNotifications,
  /useCaseNotificationsStore\(getAppPinia\(\)\)/,
);

if (failures.length > 0) {
  console.log('[fail] Pinia migration verification');
  failures.forEach((failure) => {
    console.log(`  - ${failure}`);
  });
  process.exitCode = 1;
} else {
  console.log('Pinia migration verification passed.');
}
