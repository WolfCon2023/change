# State Filing Portals Registry

## Overview

The State Filing Portals Registry is a centralized data source containing official business registration portal URLs for all 50 US states plus the District of Columbia. This registry serves as the single source of truth for state business filing information in the CHANGE platform.

## Why This Registry Exists

1. **Centralized Management**: State business registration portals change periodically. Having a single registry makes updates manageable.
2. **Consistency**: All parts of the application reference the same data, ensuring users always see consistent information.
3. **No Hardcoded URLs**: UI components should never hardcode state portal URLs. Always use the registry helpers.
4. **Type Safety**: The TypeScript wrapper provides typed access to registry data with helpful utility functions.

## File Locations

- **JSON Data**: `packages/shared/src/registries/stateFilingPortals.json`
- **TypeScript Wrapper**: `packages/shared/src/registries/stateFilingPortals.ts`

## Data Structure

Each entry in the registry contains:

```typescript
interface StateFilingPortal {
  code: string;          // Two-letter state code (e.g., "CA", "TX")
  state: string;         // Full state name (e.g., "California", "Texas")
  agencyName: string;    // Name of the agency (varies by state)
  registrationUrl: string; // Official business registration URL
  notes?: string;        // Optional notes about the portal
}
```

## Usage

### Importing the Registry

```typescript
import { 
  STATE_FILING_PORTALS,
  STATE_OPTIONS,
  getStatePortal,
  isValidStateCode,
  getAllStatePortals,
  STATE_CODES,
} from '@change/shared';
```

### Available Exports

| Export | Type | Description |
|--------|------|-------------|
| `STATE_FILING_PORTALS` | `Record<string, StateFilingPortal>` | All portals keyed by state code |
| `STATE_OPTIONS` | `Array<{ code: string; label: string }>` | State options for dropdowns (sorted alphabetically) |
| `STATE_CODES` | `string[]` | Array of all valid state codes |
| `getStatePortal(code)` | `function` | Get portal by state code (returns null if not found) |
| `isValidStateCode(code)` | `function` | Check if a state code is valid |
| `getAllStatePortals()` | `function` | Get all portals as an array |

### Examples

```typescript
// Get portal for California
const caPortal = getStatePortal('CA');
console.log(caPortal?.agencyName); // "California Secretary of State"
console.log(caPortal?.registrationUrl); // "https://bizfileonline.sos.ca.gov/"

// Validate a state code
if (isValidStateCode(userInput)) {
  // Valid state code
}

// Use in a dropdown
<select>
  {STATE_OPTIONS.map(option => (
    <option key={option.code} value={option.code}>
      {option.label}
    </option>
  ))}
</select>
```

## How to Update Links

When a state portal URL changes:

1. Open `packages/shared/src/registries/stateFilingPortals.json`
2. Find the state entry by its code
3. Update the `registrationUrl` field
4. Optionally update `agencyName` if the agency name changed
5. Add a `notes` field if needed
6. Run `npm run build --workspace=@change/shared` to rebuild
7. Test the link manually before deploying

## API Endpoints

The backend provides endpoints to access this data:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/app/reference/state-filing-portals` | GET | Get all state portals |
| `/api/v1/app/reference/state-filing-portals/:code` | GET | Get portal by state code |
| `/api/v1/app/reference/state-options` | GET | Get state options for dropdowns |

## Important Notes

- **Never hardcode portal URLs in UI components**. Always use the registry.
- Agency names vary by state. Some states use "Secretary of State" while others use different agencies (e.g., Arizona uses "Corporation Commission").
- Use neutral terminology like "State Business Filing Portal" rather than "Secretary of State" in the UI.
- All state codes are uppercase two-letter codes (e.g., "CA", not "ca" or "California").

## State Coverage

The registry covers all 50 US states plus the District of Columbia (DC), totaling 51 entries.

## Maintenance

The registry should be reviewed periodically (recommended: quarterly) to ensure:
- All URLs are still valid
- Agency names are current
- No new states or territories need to be added
