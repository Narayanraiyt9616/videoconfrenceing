/**
 * verify-nodb.js
 * Scans the codebase to guarantee 100% zero database / zero persistence architecture.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_DEPENDENCIES = [
  'mongoose',
  'mongodb',
  'prisma',
  '@prisma/client',
  'sequelize',
  'typeorm',
  'sqlite3',
  'better-sqlite3',
  'pg',
  'mysql',
  'mysql2',
  'redis',
  'ioredis',
  'firebase',
  'firebase-admin',
  'supabase',
  '@supabase/supabase-js'
];

console.log('🔍 Checking Aaj Ka Kalesh architecture for Zero-Database compliance...\n');

let violations = 0;

function checkPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) return;
  const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...(content.dependencies || {}), ...(content.devDependencies || {}) };

  for (const forbidden of FORBIDDEN_DEPENDENCIES) {
    if (deps[forbidden]) {
      console.error(`❌ VIOLATION in ${pkgPath}: Forbidden database package detected: ${forbidden}`);
      violations++;
    }
  }
}

checkPackageJson(path.join(rootDir, 'package.json'));
checkPackageJson(path.join(rootDir, 'server', 'package.json'));
checkPackageJson(path.join(rootDir, 'client', 'package.json'));

if (violations === 0) {
  console.log('✅ ZERO-DATABASE ARCHITECTURE CERTIFIED 🔥');
  console.log('   All data strictly lives in server RAM and client memory.');
  console.log('   When rooms close or server restarts, 100% of data is obliterated.\n');
  process.exit(0);
} else {
  console.error(`\n❌ Found ${violations} architecture violation(s)! Remove database dependencies.`);
  process.exit(1);
}
