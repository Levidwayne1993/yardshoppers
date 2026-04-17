import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// LOAD ENVIRONMENT
// ============================================

// Load .env.local for Supabase credentials
const envPath = path.join(__dirname, '.env.local');
if (existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
}

// ============================================
// RUN THE COLLECTOR
// ============================================

console.log('===========================================');
console.log('  YardShoppers Collector');
console.log(`  Started: ${new Date().toISOString()}`);
console.log('===========================================\n');

try {
  // Forward any CLI args to the TypeScript collector
  const args = process.argv.slice(2).join(' ');

  // Run the TypeScript main orchestrator via tsx
  const cmd = `npx tsx src/main.ts ${args}`;
  console.log(`Running: ${cmd}\n`);

  execSync(cmd, {
    cwd: path.join(__dirname, 'collector'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
    timeout: 60 * 60 * 1000, // 1 hour max
  });

  console.log('\nCollection completed successfully.');
} catch (error) {
  console.error('\nCollection failed:', error.message);
  process.exit(1);
}
