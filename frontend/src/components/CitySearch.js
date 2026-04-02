import React, { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { metaAPI } from "../lib/api";

export default function CitySearch({ value, onChange, placeholder = "Search city..." }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await metaAPI.cities(query);
        setResults(data);
        setOpen(true);
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const select = (city) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
          placeholder={placeholder}
          className="input-base pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((city) => (
            <button key={city} onClick={() => select(city)}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors">
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
