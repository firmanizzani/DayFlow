import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
const knownSecrets = [];

// Values remain local and are never printed, including on failure.
if (fs.existsSync('backend/.env')) {
  for (const line of fs.readFileSync('backend/.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && /(?:^|_)(PASSWORD|SECRET|TOKEN)$/.test(match[1]) && match[2].length >= 8) {
      knownSecrets.push(match[2]);
    }
  }
}

if (fs.existsSync('.local/qa-account.json')) {
  const qa = JSON.parse(fs.readFileSync('.local/qa-account.json', 'utf8'));
  for (const key of ['password', 'accessToken', 'refreshToken']) {
    if (qa[key]) knownSecrets.push(qa[key]);
  }
}

const findings = new Set();
for (const file of files) {
  const sensitiveName =
    /(^|\/)(\.env(?:\..*)?|\.envrc|credentials\.json|service-account.*\.json)$/i.test(
      file,
    );
  if (
    (sensitiveName && !file.endsWith('.env.example')) ||
    /\.(pem|key|p12|pfx|jks|keystore|dump|backup)$/i.test(file)
  ) {
    findings.add(file);
  }
  const content = execFileSync('git', ['show', `:${file}`], {
    maxBuffer: 20 * 1024 * 1024,
  });
  if (content.includes(0)) continue;
  const source = content.toString('utf8');
  const suspicious = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bnpg_[A-Za-z0-9]{10,}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /postgres(?:ql)?:\/\/[^\s/:]+:[^\s/@]+@/i,
  ];
  if (
    knownSecrets.some((secret) => source.includes(secret)) ||
    suspicious.some((pattern) => pattern.test(source))
  ) {
    findings.add(file);
  }
}

if (findings.size) {
  console.error('Sensitive content detected in staged files (values omitted):');
  for (const file of findings) console.error(`- ${file}`);
  process.exit(1);
}
console.log(
  `PASS: ${files.length} staged files checked; no local secrets or sensitive credential files detected.`,
);
