/**
 * Utility for generating unique identifiers for list items.
 * Used for Vue's :key bindings and data integrity.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
