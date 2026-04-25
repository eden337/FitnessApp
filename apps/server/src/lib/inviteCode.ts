import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 chars: no I, O, 0, 1
const LENGTH = 8;

/**
 * Generate an 8-character invite code from an unambiguous alphabet. Uses
 * crypto.randomBytes for entropy; rejection-samples to avoid the modulo bias
 * that would otherwise skew the distribution slightly.
 *
 * 31^8 ≈ 8.5e11 codes, so collisions are vanishingly rare even with millions
 * of couples; the caller still retries on the unique-constraint violation
 * for safety.
 */
export const generateInviteCode = (): string => {
  let out = '';
  while (out.length < LENGTH) {
    const buf = randomBytes(LENGTH * 2);
    for (let i = 0; i < buf.length && out.length < LENGTH; i++) {
      const byte = buf[i];
      if (byte === undefined) continue;
      // Reject bytes that would land in the partial bucket so the choice
      // remains uniform over the alphabet.
      if (byte >= 248) continue;
      out += ALPHABET[byte % ALPHABET.length];
    }
  }
  return out;
};
