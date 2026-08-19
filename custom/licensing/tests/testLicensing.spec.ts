import test from 'tape';
import { LicenseState } from '../types';
import { calculateGracePeriod, isGracePeriodExpiring, isGracePeriodExpired } from '../validation/grace-period';
import { encrypt, decrypt, verifyIntegrity, generateHmac } from '../cache/encryption';

// Grace Period Tests
test('Grace Period: Calculate days remaining', (t) => {
  const now = new Date();
  const lastSyncDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const gracePeriodDays = 7;

  const result = calculateGracePeriod(lastSyncDate, gracePeriodDays);

  t.equal(result.daysRemaining, 4, 'should have 4 days remaining');
  t.equal(result.isExpiring, false, 'should not be expiring yet');
  t.equal(result.isExpired, false, 'should not be expired');
  t.end();
});

test('Grace Period: Detect expiring soon', (t) => {
  const now = new Date();
  const lastSyncDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
  const gracePeriodDays = 7;

  const result = calculateGracePeriod(lastSyncDate, gracePeriodDays);

  t.equal(result.daysRemaining, 1, 'should have 1 day remaining');
  t.equal(result.isExpiring, true, 'should be expiring soon');
  t.equal(result.isExpired, false, 'should not be expired yet');
  t.end();
});

test('Grace Period: Detect expired', (t) => {
  const now = new Date();
  const lastSyncDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
  const gracePeriodDays = 7;

  const result = calculateGracePeriod(lastSyncDate, gracePeriodDays);

  t.equal(result.daysRemaining, -1, 'should be -1 days (expired)');
  t.equal(result.isExpiring, false, 'not expiring, already expired');
  t.equal(result.isExpired, true, 'should be expired');
  t.end();
});

test('Grace Period: isGracePeriodExpiring helper', (t) => {
  const now = new Date();
  const expiringSoon = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const notExpiring = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  t.equal(isGracePeriodExpiring(expiringSoon, 7), true, 'should detect expiring soon');
  t.equal(isGracePeriodExpiring(notExpiring, 7), false, 'should not detect as expiring');
  t.end();
});

test('Grace Period: isGracePeriodExpired helper', (t) => {
  const now = new Date();
  const expired = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const notExpired = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  t.equal(isGracePeriodExpired(expired, 7), true, 'should detect expired');
  t.equal(isGracePeriodExpired(notExpired, 7), false, 'should not detect as expired');
  t.end();
});

// Encryption Tests
test('Encryption: Encrypt and decrypt data', (t) => {
  const originalData = 'sensitive-license-key-12345';
  const encryptionKey = 'test-encryption-key-32-bytes!!';

  const encrypted = encrypt(originalData, encryptionKey);
  t.notEqual(encrypted, originalData, 'encrypted data should differ from original');
  t.ok(encrypted.includes(':'), 'encrypted data should have IV separator');

  const decrypted = decrypt(encrypted, encryptionKey);
  t.equal(decrypted, originalData, 'decrypted data should match original');
  t.end();
});

test('Encryption: Different IVs produce different ciphertexts', (t) => {
  const data = 'test-data';
  const key = 'test-key-32-bytes-long!!!!!!!';

  const encrypted1 = encrypt(data, key);
  const encrypted2 = encrypt(data, key);

  t.notEqual(encrypted1, encrypted2, 'same data encrypted twice should produce different ciphertexts');
  t.equal(decrypt(encrypted1, key), data, 'first encryption should decrypt correctly');
  t.equal(decrypt(encrypted2, key), data, 'second encryption should decrypt correctly');
  t.end();
});

test('Encryption: Wrong key fails decryption', (t) => {
  const data = 'secret-data';
  const correctKey = 'correct-key-32-bytes!!!!!!!!!';
  const wrongKey = 'wrong-key-32-bytes!!!!!!!!!!!';

  const encrypted = encrypt(data, correctKey);

  try {
    decrypt(encrypted, wrongKey);
    t.fail('should throw error with wrong key');
  } catch (error) {
    t.ok(error instanceof Error, 'should throw Error');
    t.end();
  }
});

test('Encryption: HMAC integrity verification', (t) => {
  const data = 'test-data';
  const key = 'hmac-key';

  const hmac = generateHmac(data, key);
  t.ok(typeof hmac === 'string', 'HMAC should be a string');
  t.ok(hmac.length > 0, 'HMAC should not be empty');

  const isValid = verifyIntegrity(data, hmac, key);
  t.equal(isValid, true, 'integrity check should pass for valid data');

  const tampered = 'tampered-data';
  const isTampered = verifyIntegrity(tampered, hmac, key);
  t.equal(isTampered, false, 'integrity check should fail for tampered data');

  t.end();
});

// License State Tests
test('License States: All states are defined', (t) => {
  const states = [
    LicenseState.ACTIVE_ONLINE,
    LicenseState.ACTIVE_OFFLINE,
    LicenseState.GRACE_EXPIRING,
    LicenseState.GRACE_EXPIRED,
    LicenseState.INVALID,
    LicenseState.EXPIRED,
    LicenseState.UNLICENSED,
  ];

  states.forEach((state) => {
    t.ok(typeof state === 'string', `${state} should be a string`);
    t.ok(state.length > 0, `${state} should not be empty`);
  });

  t.end();
});

test('License States: Unique values', (t) => {
  const states = Object.values(LicenseState);
  const uniqueStates = new Set(states);

  t.equal(
    states.length,
    uniqueStates.size,
    'all license states should have unique values'
  );
  t.end();
});

// Edge Cases
test('Grace Period: Edge case - exactly at boundary', (t) => {
  const now = new Date();
  const exactlyAtBoundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // exactly 7 days
  const gracePeriodDays = 7;

  const result = calculateGracePeriod(exactlyAtBoundary, gracePeriodDays);

  t.equal(result.daysRemaining, 0, 'should have 0 days remaining');
  t.equal(result.isExpiring, true, 'should be expiring at boundary');
  t.equal(result.isExpired, false, 'should not be expired at exact boundary');
  t.end();
});

test('Grace Period: Edge case - future date', (t) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days in future
  const gracePeriodDays = 7;

  const result = calculateGracePeriod(futureDate, gracePeriodDays);

  t.ok(result.daysRemaining > 7, 'should have more than grace period days remaining');
  t.equal(result.isExpiring, false, 'should not be expiring for future dates');
  t.equal(result.isExpired, false, 'should not be expired for future dates');
  t.end();
});

test('Encryption: Edge case - empty string', (t) => {
  const emptyString = '';
  const key = 'test-key-32-bytes-long!!!!!!!';

  const encrypted = encrypt(emptyString, key);
  const decrypted = decrypt(encrypted, key);

  t.equal(decrypted, emptyString, 'should handle empty string correctly');
  t.end();
});

test('Encryption: Edge case - special characters', (t) => {
  const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\\n\\t';
  const key = 'test-key-32-bytes-long!!!!!!!';

  const encrypted = encrypt(specialChars, key);
  const decrypted = decrypt(encrypted, key);

  t.equal(decrypted, specialChars, 'should handle special characters correctly');
  t.end();
});

test('Encryption: Edge case - unicode characters', (t) => {
  const unicode = '你好世界 🚀 émojis & ñoñó';
  const key = 'test-key-32-bytes-long!!!!!!!';

  const encrypted = encrypt(unicode, key);
  const decrypted = decrypt(encrypted, key);

  t.equal(decrypted, unicode, 'should handle unicode correctly');
  t.end();
});
