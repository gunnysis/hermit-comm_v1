#!/usr/bin/env node
/**
 * Maestro CLI 실행 (PATH 없이도 동작)
 * .env를 로드해 MAESTRO_ADMIN_EMAIL 등이 Maestro에 전달되도록 함.
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// 프로젝트 루트에서 .env 로드 (Maestro 환경 변수용)
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const home = process.env.USERPROFILE || process.env.HOME || '';
const isWin = process.platform === 'win32';
const maestroBin = path.join(home, '.maestro', 'bin', isWin ? 'maestro.bat' : 'maestro');
const args = process.argv.slice(2);

const result = spawnSync(maestroBin, args, {
  stdio: 'inherit',
  shell: isWin,
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
