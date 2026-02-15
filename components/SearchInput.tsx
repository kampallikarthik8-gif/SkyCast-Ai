
import React, { useState, useEffect, useRef } from 'react';
import { searchCities } from '../services/weatherService';
import { SearchResult } from '../types';

interface SearchInputProps {
  onSelect: (city: SearchResult) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        const cities = await searchCities(query);
        setResults(cities);
        setShowDropdown(true);
        setLoading(false);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto" ref={dropdownRef}>
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city..."
          className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {results.map((city, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelect(city);
                setQuery('');
                setShowDropdown(false);
              }}
              className="w-full text-left px-5 py-3 hover:bg-white/10 text-white transition-colors border-b border-white/5 last:border-0"
            >
              <div className="font-medium">{city.name}</div>
              <div className="text-xs text-white/60">{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
