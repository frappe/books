/**
 * Device Tag Generator with Full Debug Logging
 * Add this to your electron/main/utils/device-tag-debug.ts (or inline temporarily)
 *
 * UPDATE: now also captures the system/baseboard manufacturer (e.g. "Lenovo", "Dell",
 * "Apple") and the full OS name/version (e.g. "Windows 11 Pro", "macOS 14.5",
 * "Ubuntu 22.04.3 LTS") so tags are actually identifiable by a human, not just a
 * model number + generic platform bucket.
 */

import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';

// ============================================================
// DEBUG LOGGING HELPER
// ============================================================

const DEBUG_PREFIX = '[DeviceTag]';

function logStep(step: string, data?: any) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${DEBUG_PREFIX} STEP: ${step}`);
  console.log('='.repeat(60));
  if (data !== undefined) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(String(data));
    }
  }
}

function logRaw(label: string, value: any) {
  const display = value === undefined ? 'undefined' :
    value === null ? 'null' :
      value === '' ? '(empty string)' :
        String(value);
  console.log(`  ${DEBUG_PREFIX} ${label.padEnd(30)} -> "${display}"`);
}

function logComputed(label: string, before: any, after: any) {
  console.log(`  ${DEBUG_PREFIX} ${label}`);
  console.log(`    BEFORE: "${before}"`);
  console.log(`    AFTER:  "${after}"`);
}

// ============================================================
// DEVICE TAG COMPONENTS (with logging)
// ============================================================

interface DeviceTagComponents {
  modelName: string;
  manufacturer: string;
  platform: string;
  osVersionName: string;
  arch: string;
  hostname: string;
  ramGb: number;
  rawArch: string;
  rawPlatform: string;
  rawHostname: string;
  rawTotalMem: number;
}

function collectDeviceComponentsWithLogging(): DeviceTagComponents {
  logStep('1. COLLECTING RAW SYSTEM DATA');

  // --- Raw platform ---
  const rawPlatform = os.platform();
  logRaw('os.platform()', rawPlatform);

  // --- Raw hostname ---
  const rawHostname = os.hostname();
  logRaw('os.hostname()', rawHostname);

  // --- Raw arch ---
  const rawArch = os.arch();
  logRaw('os.arch()', rawArch);

  // --- Raw memory ---
  const rawTotalMem = os.totalmem();
  logRaw('os.totalmem() (bytes)', rawTotalMem);
  logRaw('os.totalmem() (GB)', (rawTotalMem / (1024 ** 3)).toFixed(2));

  // --- CPU info ---
  const cpus = os.cpus();
  logStep('1b. CPU INFORMATION', {
    cpuCount: cpus.length,
    firstCpuModel: cpus[0]?.model || 'N/A',
    firstCpuSpeed: cpus[0]?.speed ? `${cpus[0].speed} MHz` : 'N/A',
  });

  logStep('2. TRANSFORMING RAW DATA');

  // Platform name
  const platform = friendlyPlatformName(rawPlatform);
  logComputed('Platform name', rawPlatform, platform);

  // Hostname cleanup
  const hostname = rawHostname
    .replace(/\.local$/i, '')
    .replace(/[_-]/g, ' ');
  logComputed('Hostname cleanup', rawHostname, hostname);

  // Arch detection
  const arch = detectFriendlyArch(rawArch, rawPlatform);
  logComputed('Arch detection', `${rawArch} (platform: ${rawPlatform})`, arch);

  // RAM
  const ramGb = Math.round(rawTotalMem / (1024 ** 3));
  logComputed('RAM rounding', `${(rawTotalMem / (1024 ** 3)).toFixed(2)} GB`, `${ramGb} GB`);

  // Model detection
  logStep('3. HARDWARE MODEL DETECTION');
  const modelName = detectModelNameWithLogging(rawPlatform);

  // Manufacturer detection
  logStep('3b. HARDWARE MANUFACTURER DETECTION');
  const manufacturer = detectManufacturerWithLogging(rawPlatform);

  // OS version detection
  logStep('3c. OS NAME/VERSION DETECTION');
  const osVersionName = detectOSVersionWithLogging(rawPlatform, platform);

  const components: DeviceTagComponents = {
    modelName,
    manufacturer,
    platform,
    osVersionName,
    arch,
    hostname,
    ramGb,
    rawArch,
    rawPlatform,
    rawHostname,
    rawTotalMem,
  };

  logStep('4. FINAL COMPONENTS OBJECT', components);

  return components;
}

// ============================================================
// MODEL DETECTION WITH LOGGING
// ============================================================
function detectModelNameWithLogging(platform: string): string {
  console.log(`  ${DEBUG_PREFIX} Attempting model detection for platform: "${platform}"`);

  try {
    if (platform === 'darwin') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: system_profiler SPHardwareDataType -json`);

      try {
        const output = execSync(
          'system_profiler SPHardwareDataType -json',
          { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] }
        );

        console.log(`  ${DEBUG_PREFIX}   Raw output length: ${output.length} chars`);

        const data = JSON.parse(output);
        const hardware = data?.SPHardwareDataType?.[0];

        console.log(`  ${DEBUG_PREFIX}   Parsed hardware keys: ${Object.keys(hardware || {}).join(', ')}`);

        const model = hardware?.machine_model;
        logRaw('machine_model', model);

        const friendly = mapAppleModelWithLogging(model);
        if (friendly) {
          console.log(`  ${DEBUG_PREFIX}   Apple model mapped: "${friendly}"`);
          return friendly;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   system_profiler failed: ${err.message}`);
      }
    }

    if (platform === 'win32') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: wmic computersystem get model /value`);

      try {
        const output = execSync(
          'wmic computersystem get model /value',
          { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] }
        );

        console.log(`  ${DEBUG_PREFIX}   Raw output:`, output.split('\n').map(l => `    "${l.trim()}"`).join('\n'));

        const match = output.match(/Model=(.+)/i);
        const rawModel = match?.[1]?.trim();
        logRaw('wmic model', rawModel);

        const cleaned = cleanWindowsGenericString(rawModel);
        logComputed('Windows model cleanup', rawModel, cleaned);

        if (cleaned) {
          console.log(`  ${DEBUG_PREFIX}   Windows model detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   wmic computersystem failed: ${err.message}`);
      }

      // Fallback: baseboard
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: wmic baseboard get product /value`);

      try {
        const board = execSync(
          'wmic baseboard get product /value',
          { encoding: 'utf8', timeout: 2000, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const boardMatch = board.match(/Product=(.+)/i);
        const rawBoard = boardMatch?.[1]?.trim();
        logRaw('wmic baseboard product', rawBoard);

        const cleanedBoard = cleanWindowsGenericString(rawBoard);
        if (cleanedBoard) {
          console.log(`  ${DEBUG_PREFIX}   Windows baseboard detected: "${cleanedBoard}"`);
          return cleanedBoard;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   wmic baseboard failed: ${err.message}`);
      }

      // Fallback: PowerShell/CIM (wmic is removed on newer Windows builds)
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: PowerShell Get-CimInstance Win32_ComputerSystem`);

      try {
        const output = execSync(
          'powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_ComputerSystem).Model"',
          { encoding: 'utf8', timeout: 4000, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const cleaned = cleanWindowsGenericString(output.trim());
        logRaw('PowerShell CIM model', output.trim());

        if (cleaned) {
          console.log(`  ${DEBUG_PREFIX}   PowerShell model detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   PowerShell CIM model failed: ${err.message}`);
      }
    }

    if (platform === 'linux') {
      const sources = [
        '/sys/class/dmi/id/product_name',
        '/sys/devices/virtual/dmi/id/product_name',
        '/proc/device-tree/model',
      ];

      for (const source of sources) {
        console.log(`  ${DEBUG_PREFIX} -> Trying: ${source}`);
        try {
          const output = fs.readFileSync(source, 'utf8').trim();
          logRaw(`file content`, output);

          if (output && output !== 'System Product Name') {
            console.log(`  ${DEBUG_PREFIX}   Linux model from file: "${output}"`);
            return output;
          }
          console.log(`  ${DEBUG_PREFIX}   Skipped (empty or generic)`);
        } catch (err: any) {
          console.log(`  ${DEBUG_PREFIX}   File read failed: ${err.code || err.message}`);
        }
      }

      // lshw fallback
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: lshw`);
      try {
        const output = execSync(
          'lshw -short -C system 2>/dev/null | head -2 | tail -1',
          { encoding: 'utf8', timeout: 3000, shell: true, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const parts = output.trim().split(/\s{2,}/);
        if (parts.length > 2) {
          const result = parts.slice(2).join(' ').trim();
          console.log(`  ${DEBUG_PREFIX}   Linux model from lshw: "${result}"`);
          return result;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   lshw failed: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.log(`  ${DEBUG_PREFIX} Model detection error: ${err.message}`);
  }

  console.log(`  ${DEBUG_PREFIX} -> No model detected, will fallback to hostname`);
  return '';
}

// ============================================================
// MANUFACTURER DETECTION WITH LOGGING (NEW)
// ============================================================
function detectManufacturerWithLogging(platform: string): string {
  console.log(`  ${DEBUG_PREFIX} Attempting manufacturer detection for platform: "${platform}"`);

  try {
    if (platform === 'darwin') {
      // Apple never reports a vendor string via system_profiler the way PC
      // vendors do - it's always Apple hardware, so this is a safe constant.
      console.log(`  ${DEBUG_PREFIX} -> macOS device, manufacturer is always "Apple"`);
      return 'Apple';
    }

    if (platform === 'win32') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: wmic computersystem get manufacturer /value`);

      try {
        const output = execSync(
          'wmic computersystem get manufacturer /value',
          { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        console.log(`  ${DEBUG_PREFIX}   Raw output:`, output.split('\n').map(l => `    "${l.trim()}"`).join('\n'));

        const match = output.match(/Manufacturer=(.+)/i);
        const rawManufacturer = match?.[1]?.trim();
        logRaw('wmic manufacturer', rawManufacturer);

        const cleaned = cleanWindowsGenericString(rawManufacturer);
        logComputed('Windows manufacturer cleanup', rawManufacturer, cleaned);

        if (cleaned) {
          console.log(`  ${DEBUG_PREFIX}   Windows manufacturer detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   wmic computersystem manufacturer failed: ${err.message}`);
      }

      // Fallback: baseboard manufacturer
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: wmic baseboard get manufacturer /value`);

      try {
        const board = execSync(
          'wmic baseboard get manufacturer /value',
          { encoding: 'utf8', timeout: 2000, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const boardMatch = board.match(/Manufacturer=(.+)/i);
        const rawBoardVendor = boardMatch?.[1]?.trim();
        logRaw('wmic baseboard manufacturer', rawBoardVendor);

        const cleanedBoardVendor = cleanWindowsGenericString(rawBoardVendor);
        if (cleanedBoardVendor) {
          console.log(`  ${DEBUG_PREFIX}   Windows baseboard manufacturer detected: "${cleanedBoardVendor}"`);
          return cleanedBoardVendor;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   wmic baseboard manufacturer failed: ${err.message}`);
      }

      // Fallback: PowerShell/CIM (wmic is removed on newer Windows builds)
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: PowerShell Get-CimInstance Win32_ComputerSystem Manufacturer`);

      try {
        const output = execSync(
          'powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_ComputerSystem).Manufacturer"',
          { encoding: 'utf8', timeout: 4000, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const cleaned = cleanWindowsGenericString(output.trim());
        logRaw('PowerShell CIM manufacturer', output.trim());

        if (cleaned) {
          console.log(`  ${DEBUG_PREFIX}   PowerShell manufacturer detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   PowerShell CIM manufacturer failed: ${err.message}`);
      }
    }

    if (platform === 'linux') {
      const sources = [
        '/sys/class/dmi/id/sys_vendor',
        '/sys/devices/virtual/dmi/id/sys_vendor',
        '/sys/class/dmi/id/board_vendor',
      ];

      for (const source of sources) {
        console.log(`  ${DEBUG_PREFIX} -> Trying: ${source}`);
        try {
          const output = fs.readFileSync(source, 'utf8').trim();
          logRaw('file content', output);

          if (output && !/^(system manufacturer|to be filled by o\.?e\.?m\.?|unknown)$/i.test(output)) {
            console.log(`  ${DEBUG_PREFIX}   Linux manufacturer from file: "${output}"`);
            return output;
          }
          console.log(`  ${DEBUG_PREFIX}   Skipped (empty or generic)`);
        } catch (err: any) {
          console.log(`  ${DEBUG_PREFIX}   File read failed: ${err.code || err.message}`);
        }
      }

      // Raspberry Pi / ARM boards report vendor via device-tree, not dmi
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: /proc/device-tree/model (vendor prefix)`);
      try {
        const dt = fs.readFileSync('/proc/device-tree/model', 'utf8').trim();
        logRaw('device-tree model', dt);
        if (/raspberry pi/i.test(dt)) {
          console.log(`  ${DEBUG_PREFIX}   Detected vendor from device-tree: "Raspberry Pi Foundation"`);
          return 'Raspberry Pi Foundation';
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   device-tree read failed: ${err.code || err.message}`);
      }
    }
  } catch (err: any) {
    console.log(`  ${DEBUG_PREFIX} Manufacturer detection error: ${err.message}`);
  }

  console.log(`  ${DEBUG_PREFIX} -> No manufacturer detected`);
  return '';
}

// ============================================================
// OS VERSION DETECTION WITH LOGGING (NEW)
// ============================================================
function detectOSVersionWithLogging(rawPlatform: string, friendlyPlatform: string): string {
  console.log(`  ${DEBUG_PREFIX} Attempting OS version detection for platform: "${rawPlatform}"`);

  try {
    if (rawPlatform === 'darwin') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: sw_vers -productVersion`);
      try {
        const version = execSync('sw_vers -productVersion', {
          encoding: 'utf8', timeout: 2000, stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
        logRaw('sw_vers -productVersion', version);

        if (version) {
          const result = `macOS ${version}`;
          console.log(`  ${DEBUG_PREFIX}   macOS version detected: "${result}"`);
          return result;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   sw_vers failed: ${err.message}`);
      }
    }

    if (rawPlatform === 'win32') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: wmic os get Caption /value`);
      try {
        const output = execSync('wmic os get Caption /value', {
          encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'],
        });
        console.log(`  ${DEBUG_PREFIX}   Raw output:`, output.split('\n').map(l => `    "${l.trim()}"`).join('\n'));

        const match = output.match(/Caption=(.+)/i);
        const rawCaption = match?.[1]?.trim();
        logRaw('wmic os caption', rawCaption);

        if (rawCaption) {
          // "Microsoft Windows 11 Pro" -> "Windows 11 Pro"
          const cleaned = rawCaption.replace(/^Microsoft\s+/i, '').trim();
          logComputed('Windows caption cleanup', rawCaption, cleaned);
          console.log(`  ${DEBUG_PREFIX}   Windows OS version detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   wmic os get Caption failed: ${err.message}`);
      }

      // Fallback: PowerShell/CIM (wmic is removed on newer Windows builds)
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: PowerShell Get-CimInstance Win32_OperatingSystem`);
      try {
        const output = execSync(
          'powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_OperatingSystem).Caption"',
          { encoding: 'utf8', timeout: 4000, stdio: ['pipe', 'pipe', 'ignore'] }
        ).trim();
        logRaw('PowerShell CIM OS caption', output);

        if (output) {
          const cleaned = output.replace(/^Microsoft\s+/i, '').trim();
          console.log(`  ${DEBUG_PREFIX}   PowerShell OS version detected: "${cleaned}"`);
          return cleaned;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   PowerShell CIM OS caption failed: ${err.message}`);
      }

      // Last resort: infer from os.release() build number (10.0.22000+ => Windows 11)
      console.log(`  ${DEBUG_PREFIX} -> Trying fallback: os.release() build number heuristic`);
      const release = os.release();
      logRaw('os.release()', release);
      const build = parseInt(release.split('.')[2] || '0', 10);
      if (build >= 22000) {
        console.log(`  ${DEBUG_PREFIX}   Build ${build} >= 22000, inferring Windows 11`);
        return 'Windows 11';
      }
      if (build > 0) {
        console.log(`  ${DEBUG_PREFIX}   Build ${build} < 22000, inferring Windows 10`);
        return 'Windows 10';
      }
    }

    if (rawPlatform === 'linux') {
      console.log(`  ${DEBUG_PREFIX} -> Trying: /etc/os-release (PRETTY_NAME)`);
      try {
        const content = fs.readFileSync('/etc/os-release', 'utf8');
        const match = content.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
        const prettyName = match?.[1]?.trim();
        logRaw('PRETTY_NAME', prettyName);

        if (prettyName) {
          console.log(`  ${DEBUG_PREFIX}   Linux OS version detected: "${prettyName}"`);
          return prettyName;
        }
      } catch (err: any) {
        console.log(`  ${DEBUG_PREFIX}   /etc/os-release read failed: ${err.code || err.message}`);
      }
    }
  } catch (err: any) {
    console.log(`  ${DEBUG_PREFIX} OS version detection error: ${err.message}`);
  }

  console.log(`  ${DEBUG_PREFIX} -> No OS version detected, falling back to generic platform name: "${friendlyPlatform}"`);
  return friendlyPlatform;
}

// ============================================================
// APPLE MODEL MAPPING WITH LOGGING
// ============================================================
function mapAppleModelWithLogging(model?: string): string | undefined {
  if (!model) {
    console.log(`  ${DEBUG_PREFIX}   mapAppleModel: received undefined/empty model`);
    return undefined;
  }

  console.log(`  ${DEBUG_PREFIX}   mapAppleModel input: "${model}"`);

  const mappings: [RegExp, string, string][] = [
    [/^MacBookPro(\d+)/, 'MacBook Pro', 'Pro'],
    [/^MacBookAir(\d+)/, 'MacBook Air', 'Air'],
    [/^MacStudio/, 'Mac Studio', 'Studio'],
    [/^Macmini(\d+)/, 'Mac mini', 'mini'],
    [/^iMac(\d+)/, 'iMac', 'iMac'],
    [/^MacPro/, 'Mac Pro', 'Pro'],
  ];

  for (const [regex, baseName, shortName] of mappings) {
    const match = model.match(regex);
    if (match) {
      const gen = match[1];
      console.log(`  ${DEBUG_PREFIX}     Matched: ${shortName}, generation code: "${gen}"`);

      // Generation-specific mapping
      if (shortName === 'Pro' && baseName === 'MacBook Pro') {
        if (parseInt(gen) >= 18) return 'MacBook Pro (2021+)';
        if (parseInt(gen) >= 16) return 'MacBook Pro (2019-2020)';
        if (parseInt(gen) >= 14) return 'MacBook Pro (2016-2019)';
        return 'MacBook Pro';
      }
      if (shortName === 'Air') {
        if (parseInt(gen) >= 10) return 'MacBook Air (M1/M2/M3)';
        return 'MacBook Air';
      }
      if (shortName === 'mini') {
        if (parseInt(gen) >= 9) return 'Mac mini (M1/M2)';
        return 'Mac mini';
      }
      if (shortName === 'iMac') {
        if (parseInt(gen) >= 21) return 'iMac (24-inch)';
        if (parseInt(gen) >= 20) return 'iMac (2020)';
        return 'iMac';
      }

      return baseName;
    }
  }

  console.log(`  ${DEBUG_PREFIX}   No regex match for: "${model}"`);
  return 'Mac';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function friendlyPlatformName(platform: string): string {
  const map: Record<string, string> = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux',
    freebsd: 'FreeBSD',
  };
  return map[platform] || platform;
}

function detectFriendlyArch(arch: string, platform: string): string {
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'Apple Silicon' : 'Intel';
  }
  if (arch === 'arm64') return 'ARM';
  if (arch === 'x64') return 'x64';
  return arch;
}

/**
 * Strips the generic placeholder strings that OEMs leave in Model/Manufacturer
 * fields when they never bothered to set them (very common on desktops/DIY
 * builds and some laptops). Used for both model and manufacturer cleanup.
 */
function cleanWindowsGenericString(value?: string): string {
  if (!value) return '';
  return value
    .replace(/^System Product Name$/i, '')
    .replace(/^System Manufacturer$/i, '')
    .replace(/^To Be Filled By O\.E\.M\.?$/i, '')
    .replace(/^Not Applicable$/i, '')
    .replace(/^Default String$/i, '')
    .replace(/^Unknown$/i, '')
    .trim();
}

// ============================================================
// FORMAT WITH LOGGING
// ============================================================

function formatDeviceTagWithLogging(c: DeviceTagComponents): string {
  logStep('5. FORMATTING FINAL TAG');

  // --- Primary identifier: manufacturer + model (avoiding duplication) ---
  const hostnameFallback = c.hostname
    .replace(/\b(desktop|laptop|pc|computer|macbook|mac)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Unknown Device';

  const baseIdentifier = c.modelName || hostnameFallback;
  console.log(`  ${DEBUG_PREFIX} Base identifier: "${baseIdentifier}" (source: ${c.modelName ? 'model' : 'hostname fallback'})`);

  let primary: string;
  const modelAlreadyMentionsManufacturer =
    !!c.manufacturer && baseIdentifier.toLowerCase().includes(c.manufacturer.toLowerCase());

  if (c.manufacturer && !modelAlreadyMentionsManufacturer) {
    primary = `${c.manufacturer} ${baseIdentifier}`;
    console.log(`  ${DEBUG_PREFIX} Prefixing manufacturer: "${primary}"`);
  } else {
    primary = baseIdentifier;
    console.log(`  ${DEBUG_PREFIX} Manufacturer omitted (${!c.manufacturer ? 'not detected' : 'already implied by model'}): "${primary}"`);
  }

  // --- Context parts: OS name/version, arch (Mac only), RAM ---
  const contextParts: string[] = [];

  contextParts.push(c.osVersionName);
  console.log(`  ${DEBUG_PREFIX} Adding OS version: "${c.osVersionName}"`);

  if (c.platform === 'macOS') {
    console.log(`  ${DEBUG_PREFIX} macOS detected -> also adding arch: "${c.arch}"`);
    contextParts.push(c.arch);
  }

  contextParts.push(`${c.ramGb}GB`);
  console.log(`  ${DEBUG_PREFIX} Adding RAM: "${c.ramGb}GB"`);

  console.log(`  ${DEBUG_PREFIX} Appending hostname: "${c.hostname}"`);

  const finalTag = `${primary} (${contextParts.join(', ')}) | ${c.hostname}`;

  logStep('6. FINAL DEVICE TAG', finalTag);

  return finalTag;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Generate device tag with FULL debug logging
 * Call this during development to see exactly what's happening
 */
export function generateDeviceTagDebug(): string {
  console.log('\n' + '#'.repeat(70));
  console.log('#' + ' '.repeat(68) + '#');
  console.log('#' + '  DEVICE TAG GENERATION - FULL DEBUG LOG'.padEnd(68) + '#');
  console.log('#' + ' '.repeat(68) + '#');
  console.log('#'.repeat(70));

  const components = collectDeviceComponentsWithLogging();
  const tag = formatDeviceTagWithLogging(components);

  console.log('\n' + '#'.repeat(70));
  console.log('#' + '  RESULT: ' + tag.padEnd(58) + '#');
  console.log('#'.repeat(70) + '\n');

  return tag;
}

/**
 * Normal generateDeviceTag (no logging) for production
 */
export function generateDeviceTag(): string {
  const c = collectDeviceComponentsWithLogging();

  const hostnameFallback = c.hostname
    .replace(/\b(desktop|laptop|pc|computer|macbook|mac)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Unknown Device';

  const baseIdentifier = c.modelName || hostnameFallback;
  const modelAlreadyMentionsManufacturer =
    !!c.manufacturer && baseIdentifier.toLowerCase().includes(c.manufacturer.toLowerCase());

  const primary = c.manufacturer && !modelAlreadyMentionsManufacturer
    ? `${c.manufacturer} ${baseIdentifier}`
    : baseIdentifier;

  const ctx: string[] = [c.osVersionName];
  if (c.platform === 'macOS') ctx.push(c.arch);
  ctx.push(`${c.ramGb}GB`);

  return `${primary} (${ctx.join(', ')}) | ${c.hostname}`;
}

/**
 * Generate stable hash for API
 */
export function generateDeviceTagHash(machineId: string): string {
  const tag = generateDeviceTag();
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(tag + machineId)
    .digest('hex')
    .slice(0, 16);
}