/**
 * Device Fingerprinting - Hardware ID Generation
 * Generates consistent device identifiers for license binding
 */

import { machineIdSync } from 'node-machine-id';
import { createHash } from 'crypto';
import { networkInterfaces } from 'os';

/**
 * Generate a unique and consistent device identifier (hostId)
 * Combines machine ID, MAC address, and system info
 */
export function getDeviceId(): string {
  try {
    // Get machine ID (persists across reboots)
    const machineId = machineIdSync();
    
    // Get primary MAC address
    const macAddress = getPrimaryMacAddress();
    
    // Combine and hash for consistent ID
    const combined = `${machineId}-${macAddress}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    
    // Return first 32 characters for reasonable length
    return hash.substring(0, 32);
  } catch (error) {
    console.error('Error generating device ID:', error);
    throw new Error('Failed to generate device identifier');
  }
}

/**
 * Get the primary (non-internal) MAC address
 */
function getPrimaryMacAddress(): string {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      // Skip internal interfaces (127.0.0.1) and IPv6
      if (iface.internal || iface.family !== 'IPv4') {
        continue;
      }
      
      if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  
  // Fallback to any available MAC
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  
  throw new Error('No valid MAC address found');
}

/**
 * Verify if a hostId matches the current device
 */
export function verifyDeviceId(hostId: string): boolean {
  try {
    const currentId = getDeviceId();
    return currentId === hostId;
  } catch (error) {
    console.error('Error verifying device ID:', error);
    return false;
  }
}
