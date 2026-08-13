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
  
  // Dummy saved places for demo. In production, fetch from backend User profile.
  const savedPlaces = [
    { label: 'Domicile', lat: 14.734, lng: -17.458 },
    { label: 'Travail', lat: 14.692, lng: -17.446 },
  ];

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
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 focus-within:bg-white border-2 border-transparent focus-within:border-black rounded-2xl transition-all duration-300 overflow-hidden shadow-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={label}
          className="w-full bg-transparent px-4 py-3.5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); onChange(null as any); }}
            className="p-3 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        )}
      </div>
      
      {isOpen && (results.length > 0 || !query) && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] max-h-72 overflow-y-auto overflow-x-hidden no-scrollbar py-2">
          {results.length === 0 && !query && (
            <li
              onClick={() => {
                if ('geolocation' in navigator) {
                  setQuery('Recherche position...');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setQuery('Ma position actuelle');
                      setIsOpen(false);
                      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Ma position actuelle' });
                    },
                    (err) => {
                      setQuery('');
                      alert('Erreur de géolocalisation: ' + err.message);
                    },
                    { enableHighAccuracy: true }
                  );
                }
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                📍
              </div>
              <div className="text-sm font-bold text-blue-600">Utiliser ma position actuelle</div>
            </li>
          )}
          {results.length === 0 && !query && savedPlaces.map((sp, i) => (
            <li
              key={`saved-${i}`}
              onClick={() => {
                setQuery(sp.label);
                setIsOpen(false);
                onChange({ lat: sp.lat, lng: sp.lng, label: sp.label });
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-yellow-50 group-hover:text-yellow-500 transition-colors">
                ★
              </div>
              <div className="text-sm font-bold text-gray-700">{sp.label}</div>
            </li>
          ))}
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => {
                const point = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_place || r.display_name.split(',')[0] };
                setQuery(point.label);
                setIsOpen(false);
                onChange(point);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                📍
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-gray-900 truncate">{r.display_place || r.display_name.split(',')[0]}</div>
                <div className="text-xs text-gray-500 truncate">{r.display_address}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
