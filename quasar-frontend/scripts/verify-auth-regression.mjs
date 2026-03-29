import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

const files = {
  authService: readFileSync(join(rootDir, 'src', 'services', 'authService.ts'), 'utf8'),
  axiosBoot: readFileSync(join(rootDir, 'src', 'boot', 'axios.ts'), 'utf8'),
  adminAccessPage: readFileSync(join(rootDir, 'src', 'pages', 'AdminAccessPage.vue'), 'utf8'),
  magicLoginPage: readFileSync(join(rootDir, 'src', 'pages', 'MagicLoginPage.vue'), 'utf8'),
  routes: readFileSync(join(rootDir, 'src', 'router', 'routes.ts'), 'utf8'),
};

const failures = [];

function assertPattern(label, content, pattern) {
  if (!pattern.test(content)) {
    failures.push(label);
  }
}

function assertHeaderPrecedence() {
  const content = files.axiosBoot;
  const magicIndex = content.indexOf('x-magic-link-token');
  const virtualIndex = content.indexOf('x-virtual-auth');
  const userIdIndex = content.indexOf('x-user-id');

  if (magicIndex === -1 || virtualIndex === -1 || userIdIndex === -1) {
    failures.push('axios auth headers are missing required branches');
    return;
  }

  if (!(magicIndex < virtualIndex && virtualIndex < userIdIndex)) {
    failures.push('axios auth header precedence changed');
  }
}

assertPattern(
  'normal login endpoint contract changed',
  files.authService,
  /api\.post<\s*AuthUser\s*>\(\s*'\/api\/users\/login'/,
);
assertPattern(
  'magic login verify endpoint contract changed',
  files.authService,
  /\/api\/tasks\/\$\{token\}\/login-verify/,
);
assertPattern(
  'magic OTP request endpoint contract changed',
  files.authService,
  /api\.post\(`\/api\/tasks\/\$\{token\}\/otp`\)/,
);
assertPattern(
  'magic OTP verify endpoint contract changed',
  files.authService,
  /\/api\/tasks\/\$\{token\}\/verify/,
);
assertPattern(
  'admin access page no longer uses normal login flow',
  files.adminAccessPage,
  /authService\.login\(\{\s*username:\s*[\w.]+\.value,\s*password:\s*[\w.]+\.value,\s*\}\)/,
);
assertPattern(
  'admin access page no longer uses mock ThaID login flow',
  files.adminAccessPage,
  /authService\.loginWithMockThaId\(\{\s*personId\s*\}\)/,
);
assertPattern(
  'admin access student target route changed',
  files.adminAccessPage,
  /return '\/my-attendance';/,
);
assertPattern(
  'magic login page no longer verifies login token',
  files.magicLoginPage,
  /authService\.verifyMagicLogin\(token,\s*savedToken \|\| undefined\)/,
);
assertPattern(
  'magic login page no longer requests OTP',
  files.magicLoginPage,
  /authService\.requestMagicOtp\(token\)/,
);
assertPattern(
  'magic login page no longer verifies OTP',
  files.magicLoginPage,
  /authService\.verifyMagicOtp\(token,\s*otpInput\.value\)/,
);
assertPattern(
  'magic login page no longer persists session token',
  files.magicLoginPage,
  /writeMagicSessionToken\(token,\s*response\.session_token,\s*'local'\)/,
);
assertPattern(
  'magic login route contract changed',
  files.routes,
  /path:\s*'login\/magic\/:token'[\s\S]*pages\/MagicLoginPage\.vue[\s\S]*hideNav:\s*true/,
);
assertPattern(
  'admin access route contract changed',
  files.routes,
  /path:\s*'admin-access'[\s\S]*pages\/AdminAccessPage\.vue[\s\S]*hideNav:\s*true/,
);

assertHeaderPrecedence();

if (failures.length > 0) {
  console.log('[fail] Auth regression verification');
  failures.forEach((failure) => {
    console.log(`  - ${failure}`);
  });
  process.exitCode = 1;
} else {
  console.log('Frontend auth regression verification passed.');
}
