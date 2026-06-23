import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface MapboxAddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Suggestion {
  mapbox_id: string;
  name: string;
  place_formatted: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: MapboxAddressResult) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputId?: string;
  token?: string;
}

const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

const newSessionToken = () => {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

const extractAddress = (feature: any): MapboxAddressResult => {
  // Mapbox Search Box retrieve returns a GeoJSON FeatureCollection.
  const props = feature?.properties || {};
  const ctx = props.context || {};
  const houseNum = props.address_number || props.house_number || '';
  const street = props.street?.name || props.street || ctx?.street?.name || '';
  const line1 = (houseNum && street) ? `${houseNum} ${street}`.trim() : (props.name || street || '');
  return {
    address: line1,
    city: ctx?.place?.name || ctx?.locality?.name || ctx?.district?.name || '',
    state: ctx?.region?.region_code || ctx?.region?.region_code_full || ctx?.region?.name || '',
    zip: ctx?.postcode?.name || '',
    country: ctx?.country?.country_code || ctx?.country?.name || 'US',
  };
};

const MapboxAddressAutocomplete: React.FC<Props> = ({
  value, onChange, onSelect, name, required, placeholder, className, inputId, token,
}) => {
  const accessToken = token || process.env.REACT_APP_MAPBOX_TOKEN || '';
  const sessionTokenRef = useRef<string>(newSessionToken());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isFetching, setIsFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fetchSuggestions = (q: string) => {
    if (!accessToken || q.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setIsFetching(true);

    const params = new URLSearchParams({
      q,
      access_token: accessToken,
      session_token: sessionTokenRef.current,
      types: 'address',
      limit: '5',
      language: 'en',
    });

    fetch(`${SUGGEST_URL}?${params.toString()}`, { signal: ctl.signal })
      .then(r => r.json())
      .then(data => {
        const next: Suggestion[] = (data?.suggestions || []).map((s: any) => ({
          mapbox_id: s.mapbox_id,
          name: s.name,
          place_formatted: s.place_formatted || s.full_address || '',
        }));
        setSuggestions(next);
        setIsOpen(next.length > 0);
        setActiveIdx(-1);
      })
      .catch(err => {
        if (err?.name !== 'AbortError') console.error('Mapbox suggest failed', err);
      })
      .finally(() => setIsFetching(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(val), 180);
  };

  const handleSelect = async (s: Suggestion) => {
    setIsOpen(false);
    setSuggestions([]);
    if (!accessToken) return;
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        session_token: sessionTokenRef.current,
      });
      const res = await fetch(`${RETRIEVE_URL}/${encodeURIComponent(s.mapbox_id)}?${params.toString()}`);
      const data = await res.json();
      const feature = data?.features?.[0];
      if (feature) {
        const result = extractAddress(feature);
        // Once the user selects an address, start a fresh session for the next lookup.
        sessionTokenRef.current = newSessionToken();
        onSelect(result);
      }
    } catch (err) {
      console.error('Mapbox retrieve failed', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showMissingTokenWarning = useMemo(() => !accessToken, [accessToken]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={inputId}
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        required={required}
        placeholder={placeholder}
        className={className}
        autoComplete="street-address"
        spellCheck={false}
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0c13]/95 backdrop-blur-xl shadow-xl shadow-black/60"
        >
          {suggestions.map((s, idx) => (
            <li
              key={s.mapbox_id}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                idx === activeIdx ? 'bg-emerald-500/15 text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="font-medium">{s.name}</div>
              {s.place_formatted && (
                <div className="text-xs text-slate-500 truncate">{s.place_formatted}</div>
              )}
            </li>
          ))}
          {isFetching && (
            <li className="px-3 py-2 text-xs text-slate-500">Searching…</li>
          )}
        </ul>
      )}
      {showMissingTokenWarning && (
        <p className="text-[11px] text-amber-400/80 mt-1">
          Address autocomplete is disabled (set <code>REACT_APP_MAPBOX_TOKEN</code>).
        </p>
      )}
    </div>
  );
};

export default MapboxAddressAutocomplete;
