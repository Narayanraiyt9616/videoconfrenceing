import { execSync } from 'child_process';
import os from 'os';

const PORT = parseInt(process.env.PORT || '5000', 10);
const isWindows = os.platform() === 'win32';

export function identifyAndCleanPort(targetPort = PORT, autoKillProjectProcess = true) {
  try {
    let pid = null;

    if (isWindows) {
      try {
        const netstatOutput = execSync(`netstat -ano -p tcp`, { encoding: 'utf-8' });
        const lines = netstatOutput.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          // Format: Proto Local Address Foreign Address State PID
          if (parts.length >= 5 && parts[1] && parts[3] === 'LISTENING') {
            const address = parts[1];
            if (address.endsWith(`:${targetPort}`)) {
              pid = parseInt(parts[4], 10);
              break;
            }
          }
        }
      } catch {
        // netstat error or port not found
      }
    } else {
      try {
        const lsofOutput = execSync(`lsof -t -i:${targetPort}`, { encoding: 'utf-8' }).trim();
        if (lsofOutput) {
          pid = parseInt(lsofOutput.split('\n')[0], 10);
        }
      } catch {
        // Port not occupied
      }
    }

    if (!pid || isNaN(pid)) {
      console.log(`✅ [Port Check] Port ${targetPort} is free and ready.`);
      return { free: true };
    }

    // Inspect the occupying process
    let cmdLine = '';
    let procName = '';
    if (isWindows) {
      try {
        const wmiOutput = execSync(
          `powershell -Command "Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' | Select-Object Name, CommandLine | ConvertTo-Json"`,
          { encoding: 'utf-8' }
        ).trim();
        if (wmiOutput) {
          const proc = JSON.parse(wmiOutput);
          procName = proc.Name || '';
          cmdLine = proc.CommandLine || '';
        }
      } catch {
        // fallback
      }
    }

    console.log(`\n🔍 [Port Check] Port ${targetPort} is currently occupied by PID ${pid} (${procName || 'Unknown'}).`);
    if (cmdLine) {
      console.log(`   Command: ${cmdLine}`);
    }

    // Determine if process belongs to this project
    const isThisProject =
      cmdLine.toLowerCase().includes('server.js') ||
      cmdLine.toLowerCase().includes('d:\\hub\\server') ||
      cmdLine.toLowerCase().includes('d:/hub/server') ||
      cmdLine.toLowerCase().includes('nodemon');

    if (isThisProject) {
      console.log(`⚠️  [Port Check] Identified previous instance of this project on PID ${pid}.`);
      if (autoKillProjectProcess) {
        console.log(`🔄 [Port Check] Safely terminating previous project instance (PID ${pid})...`);
        if (isWindows) {
          execSync(`taskkill /F /PID ${pid}`);
        } else {
          execSync(`kill -9 ${pid}`);
        }
        console.log(`✅ [Port Check] Port ${targetPort} is now freed.`);
        return { free: true, killedPreviousInstance: true, pid };
      }
      return { free: false, belongsToProject: true, pid };
    } else {
      console.error(`❌ [Port Check Alert] Port ${targetPort} is occupied by an UNRELATED application (${procName}).`);
      console.error(`   Antigravity will NOT terminate unrelated applications.`);
      console.error(`   Please configure a different PORT in server/.env or stop the external application.`);
      return { free: false, belongsToProject: false, pid, procName };
    }
  } catch (err) {
    console.warn(`[Port Check] Warning while inspecting port: ${err.message}`);
    return { free: false, error: err.message };
  }
}

// Allow direct execution: node scripts/check-port.js
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.includes('check-port.js')) {
  identifyAndCleanPort(PORT, true);
}
