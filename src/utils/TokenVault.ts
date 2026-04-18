/**
 * TokenVault provides obfuscated storage for sensitive tokens in localStorage.
 * Prevents casual exposure via browser DevTools or token-scanning extensions.
 *
 * NOTE: This is NOT cryptographic security — any code running in the same origin
 * can reverse the encoding. For true security, use server-side OAuth flows.
 * This layer raises the bar above plaintext storage and defeats automated
 * scanners that grep for known token prefixes like `ghp_`.
 */
export class TokenVault {
  private static readonly STORAGE_KEY = 'tdee_vault_v1';
  private static readonly ENTROPY = 'tdee-max-vault-2024';

  /**
   * Stores a token in obfuscated form.
   * Passing an empty string clears the stored token.
   */
  static store(token: string): void {
    if (!token) {
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }
    const encoded = btoa(this.xor(token, this.ENTROPY));
    localStorage.setItem(this.STORAGE_KEY, encoded);
  }

  /**
   * Retrieves and decodes the stored token.
   * Returns empty string if nothing is stored or decoding fails.
   */
  static retrieve(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return '';
    try {
      return this.xor(atob(stored), this.ENTROPY);
    } catch {
      return '';
    }
  }

  /**
   * Migrates plaintext token from the legacy `useStorage` key.
   * Removes the legacy key after successful migration.
   * @returns The migrated token, or empty string if no legacy data found.
   */
  static migrateLegacy(): string {
    const LEGACY_KEY = 'tdee_github_token';
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return '';

    let token = '';
    try {
      // useStorage serializes strings via JSON.stringify → '"ghp_xxx"'
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && parsed.length > 0) {
        token = parsed;
      }
    } catch {
      // Fallback: raw non-JSON string
      if (raw.length > 0 && !raw.startsWith('"')) {
        token = raw;
      }
    }

    if (token) {
      this.store(token);
    }
    localStorage.removeItem(LEGACY_KEY);
    return token;
  }

  /**
   * Simple XOR cipher — not cryptographic, but sufficient to
   * defeat plaintext pattern matching on localStorage values.
   */
  private static xor(str: string, key: string): string {
    return str
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  }
}
