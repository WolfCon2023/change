/**
 * State Filing Portals Registry
 * 
 * Single source of truth for all US state business filing portal information.
 * Do not hardcode state URLs in UI components. Always use this registry.
 */

import stateFilingPortalsData from './stateFilingPortals.json';

/**
 * Represents a state business filing portal
 */
export interface StateFilingPortal {
  /** Two-letter state code (e.g., "CA", "TX") */
  code: string;
  /** Full state name (e.g., "California", "Texas") */
  state: string;
  /** Name of the agency responsible for business filings */
  agencyName: string;
  /** Official URL for business registration */
  registrationUrl: string;
  /** Optional notes about the portal */
  notes?: string;
}

/**
 * Record of all state filing portals keyed by state code
 */
export const STATE_FILING_PORTALS: Record<string, StateFilingPortal> = stateFilingPortalsData as Record<string, StateFilingPortal>;

/**
 * Get a state filing portal by state code
 * @param code Two-letter state code (e.g., "CA", "TX")
 * @returns StateFilingPortal or null if not found
 */
export function getStatePortal(code: string): StateFilingPortal | null {
  const upperCode = code?.toUpperCase();
  return STATE_FILING_PORTALS[upperCode] || null;
}

/**
 * Array of state options for dropdowns and selectors
 * Sorted alphabetically by state name
 */
export const STATE_OPTIONS: Array<{ code: string; label: string }> = Object.values(STATE_FILING_PORTALS)
  .map((portal) => ({
    code: portal.code,
    label: portal.state,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * Array of all state codes
 */
export const STATE_CODES: string[] = Object.keys(STATE_FILING_PORTALS);

/**
 * Check if a state code is valid
 * @param code Two-letter state code
 * @returns true if valid
 */
export function isValidStateCode(code: string): boolean {
  return !!STATE_FILING_PORTALS[code?.toUpperCase()];
}

/**
 * Get all state filing portals as an array
 * @returns Array of all StateFilingPortal objects
 */
export function getAllStatePortals(): StateFilingPortal[] {
  return Object.values(STATE_FILING_PORTALS);
}
