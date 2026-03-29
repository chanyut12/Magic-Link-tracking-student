import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const rootDir = process.cwd();
const srcDir = join(rootDir, 'src');

const scanDirs = [
  join(srcDir, 'pages'),
  join(srcDir, 'layouts'),
  join(srcDir, 'components'),
  join(srcDir, 'composables'),
];

const allowedStorageFiles = new Set([
  join(srcDir, 'composables', 'authSessionState.ts'),
  join(srcDir, 'composables', 'caseNotificationState.ts'),
]);

const forbiddenApiPatterns = [
  /api\.(get|post|put|delete|patch)\s*\(/g,
  /fetch\s*\(/g,
];

const localhostPattern = /(https?:\/\/)?localhost:3000/g;
const storagePattern = /(localStorage|sessionStorage)/g;

function walkFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }

    if (!statSync(fullPath).isFile()) {
      return [];
    }

    return fullPath;
  });
}

function collectViolations() {
  const apiViolations = [];
  const localhostViolations = [];
  const storageViolations = [];

  const srcFiles = walkFiles(srcDir).filter((file) => file.endsWith('.ts') || file.endsWith('.vue'));
  const boundaryFiles = scanDirs.flatMap((dir) => walkFiles(dir)).filter((file) => (
    file.endsWith('.ts') || file.endsWith('.vue')
  ));

  for (const file of boundaryFiles) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of forbiddenApiPatterns) {
      if (pattern.test(content)) {
        apiViolations.push(relative(rootDir, file));
        break;
      }
    }
  }

  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf8');

    if (localhostPattern.test(content)) {
      localhostViolations.push(relative(rootDir, file));
    }

    if (storagePattern.test(content) && !allowedStorageFiles.has(file)) {
      storageViolations.push(relative(rootDir, file));
    }
  }

  return {
    apiViolations,
    localhostViolations,
    storageViolations,
  };
}

function printSection(title, items) {
  if (items.length === 0) {
    console.log(`[pass] ${title}`);
    return;
  }

  console.log(`[fail] ${title}`);
  items.forEach((item) => {
    console.log(`  - ${item}`);
  });
}

const result = collectViolations();

printSection('No direct api/fetch usage in pages/layouts/components/composables', result.apiViolations);
printSection('No hardcoded localhost backend URLs in src', result.localhostViolations);
printSection('Storage access stays inside approved composable helpers', result.storageViolations);

if (
  result.apiViolations.length > 0
  || result.localhostViolations.length > 0
  || result.storageViolations.length > 0
) {
  process.exitCode = 1;
} else {
  console.log('Frontend refactor boundary verification passed.');
}
