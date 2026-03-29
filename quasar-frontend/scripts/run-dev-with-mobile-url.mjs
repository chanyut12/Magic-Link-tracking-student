import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const DEFAULT_PORT = 9001;

function parseArgValue(argv, keys) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (keys.includes(value)) {
      return argv[index + 1];
    }

    for (const key of keys) {
      const prefix = `${key}=`;
      if (value.startsWith(prefix)) {
        return value.slice(prefix.length);
      }
    }
  }

  return null;
}

function isPrivateIpv4(address) {
  return (
    /^10\./.test(address)
    || /^192\.168\./.test(address)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function collectLanAddresses() {
  const interfaces = networkInterfaces();
  const addresses = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal || !isPrivateIpv4(entry.address)) {
        continue;
      }

      addresses.push({
        name,
        address: entry.address,
      });
    }
  }

  return addresses.sort((left, right) => left.name.localeCompare(right.name));
}

function resolvePort(argv) {
  const argPort = parseArgValue(argv, ['--port', '-p']);
  const envPort = process.env.DEV_SERVER_PORT || process.env.PORT;
  const rawPort = argPort || envPort || String(DEFAULT_PORT);
  const port = Number.parseInt(rawPort, 10);

  return Number.isFinite(port) ? port : DEFAULT_PORT;
}

function resolveProtocol(argv) {
  const protocol = parseArgValue(argv, ['--protocol']);

  if (protocol === 'https') {
    return 'https';
  }

  return 'http';
}

function printBanner(argv) {
  const protocol = resolveProtocol(argv);
  const port = resolvePort(argv);
  const publicHost = process.env.DEV_PUBLIC_HOST?.trim();
  const lanAddresses = collectLanAddresses();

  console.log('');
  console.log('Frontend dev server');
  console.log(`- Local: ${protocol}://localhost:${port}`);

  if (publicHost) {
    console.log(`- Mobile (fixed host): ${protocol}://${publicHost}:${port}`);
  } else if (lanAddresses.length > 0) {
    console.log(`- Mobile (same Wi-Fi): ${protocol}://${lanAddresses[0].address}:${port}`);
  } else {
    console.log('- Mobile (same Wi-Fi): no private LAN IPv4 address detected');
  }

  if (!publicHost && lanAddresses.length > 1) {
    console.log('- Other LAN candidates:');
    for (const entry of lanAddresses.slice(1)) {
      console.log(`  ${protocol}://${entry.address}:${port} (${entry.name})`);
    }
  }

  console.log('');
  console.log('Android tip');
  console.log('- Keep the URL stable by reserving this computer IP in your router (DHCP reservation).');
  console.log('- Optional: set DEV_PUBLIC_HOST to the reserved IP so this command always prints the same mobile URL.');
  console.log('');
}

function run() {
  const argv = process.argv.slice(2);
  const command = process.platform === 'win32' ? 'quasar.cmd' : 'quasar';

  printBanner(argv);

  const child = spawn(command, ['dev', ...argv], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('Failed to start Quasar dev server.');
    console.error(error);
    process.exit(1);
  });
}

run();
