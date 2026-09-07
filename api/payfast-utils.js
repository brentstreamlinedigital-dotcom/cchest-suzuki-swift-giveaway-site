import crypto from 'crypto';

/**
 * Generates an MD5 signature according to PayFast standard payment form specification.
 *
 * Rules:
 * 1. Exclude 'signature' property and any properties with empty strings, null, or undefined values.
 * 2. Trim whitespace from parameter values.
 * 3. PRESERVE the insertion order of fields (do NOT sort alphabetically - that breaks PayFast checkout).
 * 4. Encode parameters using standard URL encoding with spaces as '+' and special chars as uppercase hex.
 * 5. Append passphrase if present (`&passphrase=...`).
 * 6. Generate MD5 hash of the parameter string.
 */
export function generatePayfastSignature(data, passphrase = '') {
  // Preserve insertion order - PayFast requires the documented field order, NOT alphabetical
  const keys = Object.keys(data).filter(
    key => key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined
  );

  const pfEncode = (val) =>
    encodeURIComponent(String(val).trim())
      .replace(/%20/g, '+')
      .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

  let getString = keys
    .map(key => `${key}=${pfEncode(data[key])}`)
    .join('&');

  if (passphrase && String(passphrase).trim() !== '') {
    getString += `&passphrase=${pfEncode(passphrase)}`;
  }

  return crypto.createHash('md5').update(getString).digest('hex');
}
