import { useState, useEffect, useRef } from 'react';
import type { GeoPoint } from '../types';

interface PlaceSelectProps {
  label: string;
  value: string;
  onChange: (point: GeoPoint) => void;
}

export default function PlaceSelect({ label, value, onChange }: PlaceSelectProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query === value) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete?key=pk.ef8f3d80db02a286ae4b6fae736af632&q=${encodeURIComponent(query)}&countrycodes=sn&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        }
      } catch (e) {}
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, value]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder="Entrez une adresse..."
        className="w-full border rounded-lg px-3 py-2 mt-1"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-[100%] bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => {
                const point = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_place || r.display_name.split(',')[0] };
                setQuery(point.label);
                setIsOpen(false);
                onChange(point);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <div className="font-semibold">{r.display_place || r.display_name.split(',')[0]}</div>
              <div className="text-xs text-gray-500 truncate">{r.display_address}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
