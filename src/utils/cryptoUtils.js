const crypto = require('crypto');

/**
 * Calculates MD5 hash of string
 */
function toMD5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Decodes base64 string to utf8 string
 */
function decodeBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('utf8');
  } catch (err) {
    return str;
  }
}

/**
 * Encodes string to base64
 */
function toBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

/**
 * Checks if string is valid hex MD5 hash (32 hex characters)
 */
function isMD5Hash(str) {
  return typeof str === 'string' && /^[a-fA-F0-9]{32}$/.test(str);
}

/**
 * Verifies client password (which can be Base64 or MD5 encoded from client)
 * against stored password in database (which may also be stored as Base64/MD5 or plaintext).
 */
function verifyPassword(clientPassword, storedPassword) {
  if (!clientPassword || !storedPassword) return false;

  // 1. Direct match (e.g. client sent exact encoded string stored in DB)
  if (clientPassword === storedPassword) {
    return true;
  }

  // 2. Case-insensitive match (for MD5 hex strings)
  if (clientPassword.toLowerCase() === storedPassword.toLowerCase()) {
    return true;
  }

  // 3. Try Base64 decoding client password
  const decodedClientPass = decodeBase64(clientPassword);
  if (decodedClientPass === storedPassword) {
    return true;
  }

  // 4. Try MD5 of decoded client password vs stored password
  if (toMD5(decodedClientPass).toLowerCase() === storedPassword.toLowerCase()) {
    return true;
  }

  // 5. Try MD5 of raw client password vs stored password
  if (toMD5(clientPassword).toLowerCase() === storedPassword.toLowerCase()) {
    return true;
  }

  return false;
}

module.exports = {
  toMD5,
  toBase64,
  decodeBase64,
  isMD5Hash,
  verifyPassword
};
