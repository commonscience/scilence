/**
 * Deterministic, dependency-free string hash (FNV-1a → hex).
 *
 * No `crypto`, no node builtins — runnable identically in a browser or node.
 * Used for `promptHash` and any content-addressing the substrate needs. This
 * is NOT a security primitive; it is a stable fingerprint.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * FNV-1a over the UTF-16 code units of `input`, folded to an unsigned 32-bit
 * value and rendered as zero-padded lowercase hex (8 chars).
 */
export function stableHash(input: string): string {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i) & 0xff;
    // Keep the high byte too so multi-byte code units still perturb the hash.
    hash = Math.imul(hash, FNV_PRIME);
    hash ^= (input.charCodeAt(i) >> 8) & 0xff;
    hash = Math.imul(hash, FNV_PRIME);
  }
  // >>> 0 coerces to unsigned 32-bit.
  return (hash >>> 0).toString(16).padStart(8, '0');
}
