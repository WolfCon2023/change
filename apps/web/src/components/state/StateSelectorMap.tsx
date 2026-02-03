/**
 * StateSelectorMap Component
 * 
 * A modern, interactive US map for selecting business formation state.
 * Uses react-simple-maps for rendering and the state filing portals registry
 * for state data.
 * 
 * This component only emits state codes. All link resolution occurs via the registry.
 */

import { useState, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Search, MapPin, ExternalLink, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { 
  STATE_OPTIONS, 
  getStatePortal,
} from '@change/shared';

// US TopoJSON URL (from unpkg CDN)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to state code mapping
const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};

interface StateSelectorMapProps {
  /** Currently selected state code */
  selectedState?: string;
  /** Callback when a state is selected */
  onStateSelect: (stateCode: string) => void;
  /** Show the selected state portal info */
  showPortalInfo?: boolean;
  /** Compact mode (smaller map) */
  compact?: boolean;
  /** Disable state selection */
  disabled?: boolean;
}

export function StateSelectorMap({
  selectedState,
  onStateSelect,
  showPortalInfo = true,
  compact = false,
  disabled = false,
}: StateSelectorMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get portal info for selected and hovered states
  const selectedPortal = useMemo(() => 
    selectedState ? getStatePortal(selectedState) : null,
    [selectedState]
  );
  
  const hoveredPortal = useMemo(() => 
    hoveredState ? getStatePortal(hoveredState) : null,
    [hoveredState]
  );

  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return STATE_OPTIONS;
    const query = searchQuery.toLowerCase();
    return STATE_OPTIONS.filter(
      state => 
        state.label.toLowerCase().includes(query) ||
        state.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle state click
  const handleStateClick = useCallback((stateCode: string) => {
    if (disabled) return;
    onStateSelect(stateCode);
  }, [disabled, onStateSelect]);

  // Handle dropdown change
  const handleDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      handleStateClick(value);
      setSearchQuery('');
    }
  }, [handleStateClick]);

  // Get fill color for a state
  const getStateFill = useCallback((stateCode: string) => {
    if (stateCode === selectedState) return '#3b82f6'; // Blue for selected
    if (stateCode === hoveredState) return '#60a5fa'; // Lighter blue for hover
    return '#e5e7eb'; // Gray for default
  }, [selectedState, hoveredState]);

  // Get stroke color for a state
  const getStateStroke = useCallback((stateCode: string) => {
    if (stateCode === selectedState) return '#1d4ed8'; // Dark blue for selected
    return '#9ca3af'; // Gray for default
  }, [selectedState]);

  return (
    <div className={`bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header with search and dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white"
            disabled={disabled}
          />
        </div>
        
        {/* Dropdown fallback for accessibility */}
        <select
          value={selectedState || ''}
          onChange={handleDropdownChange}
          disabled={disabled}
          className="h-10 px-3 rounded-md border border-input bg-white text-sm min-w-[180px]"
        >
          <option value="">Select a state...</option>
          {filteredStates.map((state) => (
            <option key={state.code} value={state.code}>
              {state.label} ({state.code})
            </option>
          ))}
        </select>
      </div>

      {/* Map container */}
      <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: compact ? 800 : 1000,
          }}
          style={{
            width: '100%',
            height: compact ? '250px' : '350px',
          }}
        >
          <ZoomableGroup center={[-96, 38]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: Array<{ id: string; rsmKey: string }> }) =>
                geographies.map((geo) => {
                  const fipsCode = geo.id;
                  const stateCode = FIPS_TO_STATE[fipsCode];
                  
                  if (!stateCode) return null;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getStateFill(stateCode)}
                      stroke={getStateStroke(stateCode)}
                      strokeWidth={stateCode === selectedState ? 2 : 0.5}
                      style={{
                        default: {
                          outline: 'none',
                          transition: 'all 0.2s ease-in-out',
                        },
                        hover: {
                          outline: 'none',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transform: 'scale(1.02)',
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={() => {
                        if (!disabled) {
                          setHoveredState(stateCode);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredState(null);
                      }}
                      onClick={() => handleStateClick(stateCode)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip for hovered state */}
        {hoveredState && hoveredPortal && !compact && (
          <div 
            className="absolute z-10 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
            style={{
              left: '50%',
              bottom: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-medium">{hoveredPortal.state}</span>
            <span className="text-slate-300 ml-1">({hoveredPortal.code})</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500 border border-blue-700" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-400" />
          <span>Hover</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400" />
          <span>Available</span>
        </div>
      </div>

      {/* Selected state portal info */}
      {showPortalInfo && selectedPortal && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-slate-900">
                  {selectedPortal.state}
                </h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  {selectedPortal.code}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                {selectedPortal.agencyName}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPortal.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  Visit official portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-xs font-medium">Selected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StateSelectorMap;
