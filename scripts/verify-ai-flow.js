import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../server');
const scriptPath = path.resolve(serverDir, 'scripts/verify-ai-flow.js');

// Spawn the backend verification script with server working directory
const child = spawn(process.execPath, [scriptPath], {
  cwd: serverDir,
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
