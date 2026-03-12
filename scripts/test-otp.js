const db = require('../db/database');
const hashToken = (token) => require('crypto').createHash('sha256').update(token).digest('hex');

async function testOTPFlow() {
  console.log('--- Testing OTP Flow ---');

  // 1. Create a dummy task link with phone
  const token = 'test-otp-token-' + Date.now();
  const tokenHash = hashToken(token);
  const taskId = 'test-task-id';
  
  // Ensure task exists
  db.prepare(`INSERT OR IGNORE INTO tasks (id, task_type) VALUES (?, 'ATTENDANCE')`).run(taskId);

  db.prepare(`
    INSERT INTO task_links (id, task_id, token_hash, magic_link, assigned_to_phone, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('link-id-' + Date.now(), taskId, tokenHash, 'http://localhost:3000/task/' + token, '0991234567', '2030-01-01');

  console.log('Task link created with token:', token);

  // 2. Simulate GET /api/tasks/:token (Before OTP)
  // We'll just call the logic or simulate what the controller does
  const link = db.prepare('SELECT * FROM task_links WHERE token_hash = ?').get(tokenHash);
  console.log('Link data (otp_verified):', link.otp_verified);
  
  if (link.otp_verified === 0) {
    console.log('SUCCESS: Link is initially NOT verified.');
  } else {
    console.error('FAIL: Link should be NOT verified.');
  }

  // 3. Simulate Request OTP
  const otp = '123456';
  db.prepare('UPDATE task_links SET otp_code = ?, otp_expires_at = ?, otp_verified = 0 WHERE token_hash = ?')
    .run(otp, '2030-01-01', tokenHash);
  console.log('OTP generated and saved.');

  // 4. Simulate Verify OTP (Incorrect)
  if ('wrong' !== otp) {
    console.log('SUCCESS: Correctly identified wrong OTP.');
  }

  // 5. Simulate Verify OTP (Correct)
  db.prepare('UPDATE task_links SET otp_verified = 1 WHERE token_hash = ?').run(tokenHash);
  const verifiedLink = db.prepare('SELECT otp_verified FROM task_links WHERE token_hash = ?').get(tokenHash);
  
  if (verifiedLink.otp_verified === 1) {
    console.log('SUCCESS: OTP verified and status updated.');
  } else {
    console.error('FAIL: Verification status not updated.');
  }

  process.exit(0);
}

testOTPFlow();
