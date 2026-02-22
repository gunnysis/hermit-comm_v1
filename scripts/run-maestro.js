#!/usr/bin/env node
/**
 * Maestro CLI 실행 (PATH 없이도 동작)
 * .env를 로드해 MAESTRO_ADMIN_EMAIL 등이 Maestro에 전달되도록 함.
 *
 * test 명령 시 플로우를 순차 실행(한 번에 한 플로우씩)하여 병렬 충돌을 방지함.
 * 관리자 플로우 직전에는 기본으로 앱 데이터를 초기화(adb pm clear)하여 익명 세션을 보장함.
 * MAESTRO_CLEAR_APP_DATA=false 로 비활성화 가능.
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

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
const rawArgs = process.argv.slice(2);
const resumeFlag = rawArgs.includes('--resume');
const args = rawArgs.filter((a) => a !== '--resume');

const APP_ID = 'com.gns.hermitcomm.dev';
const E2E_LAST_FAILED_FILE = path.join(root, '.maestro', '.e2e-last-failed');
const E2E_FLOW_ORDER = [
  '.maestro/app-launch.yaml',
  '.maestro/admin-login.yaml',
  '.maestro/admin-create-group.yaml',
  '.maestro/admin-logout.yaml',
  '.maestro/admin-create-group-invite-test.yaml',
  '.maestro/groups-join-by-invite.yaml',
  '.maestro/e2e-cleanup.yaml',
];

function isAdminFlow(flowPath) {
  const name = path.basename(flowPath, '.yaml');
  return name.startsWith('admin-');
}

function getAdbPath() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    const adb = path.join(androidHome, 'platform-tools', isWin ? 'adb.exe' : 'adb');
    if (fs.existsSync(adb)) return adb;
  }
  return 'adb';
}

function clearAppData() {
  const adbPath = getAdbPath();
  const r = spawnSync(adbPath, ['shell', 'pm', 'clear', APP_ID], {
    stdio: 'inherit',
    shell: isWin,
    cwd: root,
    env: process.env,
  });
  return r.status === 0;
}

function runMaestroTest(flowPath) {
  return spawnSync(maestroBin, ['test', flowPath], {
    stdio: 'inherit',
    shell: isWin,
    cwd: root,
    env: process.env,
  });
}

// test 명령이고 플로우 목록이 주어진 경우 순차 실행
if (args[0] === 'test' && args.length >= 2) {
  let flows = args.slice(1);
  if (flows.length === 1 && (flows[0] === '.maestro' || flows[0] === '.maestro/')) {
    flows = [...E2E_FLOW_ORDER];
    // --resume: 마지막 실패 플로우부터 재실행
    if (resumeFlag) {
      const lastFailedPath = (() => {
        try {
          if (fs.existsSync(E2E_LAST_FAILED_FILE)) {
            return fs.readFileSync(E2E_LAST_FAILED_FILE, 'utf8').trim();
          }
        } catch (_) {}
        return null;
      })();
      const idx = lastFailedPath
        ? E2E_FLOW_ORDER.findIndex((p) => path.normalize(p) === path.normalize(lastFailedPath))
        : -1;
      if (idx >= 0) {
        flows = E2E_FLOW_ORDER.slice(idx);
        console.log(`[run-maestro] Resume from ${path.basename(flows[0])} (${flows.length} flow(s))`);
      } else if (lastFailedPath) {
        console.warn(`[run-maestro] Unknown last-failed "${lastFailedPath}", running full order.`);
      }
    }
  }
  // 기본값 true: 세션 복원 시 "관리자 로그인"이 안 보이므로, 관리자 플로우 전에 앱 데이터 초기화
  const clearAppDataFlag = process.env.MAESTRO_CLEAR_APP_DATA !== 'false';

  for (const flowPath of flows) {
    if (clearAppDataFlag && isAdminFlow(flowPath)) {
      console.log(`[run-maestro] Clearing app data before ${path.basename(flowPath)}...`);
      if (!clearAppData()) {
        console.error('[run-maestro] adb pm clear failed, continuing anyway.');
      }
    }
    const result = runMaestroTest(flowPath);
    if (result.status !== 0) {
      // 실패/성공 여부와 관계없이 테스트 그룹 삭제 시도 (실패한 플로우가 cleanup 자체가 아닐 때)
      const cleanupPath = path.normalize('.maestro/e2e-cleanup.yaml');
      if (path.normalize(flowPath) !== cleanupPath) {
        console.log('[run-maestro] Running e2e-cleanup to remove test groups...');
        runMaestroTest('.maestro/e2e-cleanup.yaml');
      }
      try {
        fs.mkdirSync(path.dirname(E2E_LAST_FAILED_FILE), { recursive: true });
        fs.writeFileSync(E2E_LAST_FAILED_FILE, flowPath, 'utf8');
      } catch (_) {}
      console.error(`[run-maestro] Failed at ${path.basename(flowPath)}. Resume with: npm run test:e2e:resume`);
      process.exit(result.status ?? 1);
    }
  }
  // 전체 성공 시 재개용 파일 삭제
  try {
    if (fs.existsSync(E2E_LAST_FAILED_FILE)) fs.unlinkSync(E2E_LAST_FAILED_FILE);
  } catch (_) {}
  process.exit(0);
}

// 그 외: 기존처럼 maestro에 인자 그대로 전달
const result = spawnSync(maestroBin, args, {
  stdio: 'inherit',
  shell: isWin,
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
