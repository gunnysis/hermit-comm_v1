import { draftStorage } from './storage';
import { SEARCH_CONFIG } from './constants';

const RECENT_SEARCHES_KEY = 'search_recent';

export function getRecentSearches(): string[] {
  try {
    const raw = draftStorage.getString(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, SEARCH_CONFIG.RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query.trim());
  draftStorage.set(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, SEARCH_CONFIG.RECENT_MAX)));
}

export function removeRecentSearch(query: string): string[] {
  const recent = getRecentSearches().filter((q) => q !== query);
  draftStorage.set(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  return recent;
}

export function clearAllRecentSearches(): void {
  draftStorage.remove(RECENT_SEARCHES_KEY);
}
