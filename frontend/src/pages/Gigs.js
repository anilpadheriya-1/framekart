import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, ChevronDown, X } from "lucide-react";
import GigCard from "../components/GigCard";
import CitySearch from "../components/CitySearch";
import { gigsAPI, metaAPI } from "../lib/api";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function Gigs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    subcategory: "",
    location: "",
    min_price: "",
    max_price: "",
    min_rating: "",
    sort: "newest",
    page: 1,
  });

  useEffect(() => {
    metaAPI.categories().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== null));
      const { data } = await gigsAPI.list(params);
      setGigs(data.gigs);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  const set = (key, val) => setFilters((p) => ({ ...p, [key]: val, page: 1 }));
  const clearFilters = () => setFilters((p) => ({ ...p, category: "", subcategory: "", location: "", min_price: "", max_price: "", min_rating: "", page: 1 }));

  const activeFilterCount = [filters.category, filters.subcategory, filters.location, filters.min_price, filters.max_price, filters.min_rating].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-zinc-100 mb-1">Browse Gigs</h1>
        <p className="text-zinc-500 text-sm">{total.toLocaleString()} professionals available</p>
      </div>

      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text" value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search gigs..."
            className="input-base pl-9"
          />
        </div>
        <select value={filters.sort} onChange={(e) => set("sort", e.target.value)}
          className="input-base sm:w-48">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${activeFilterCount > 0 ? "border-emerald-500/50 text-emerald-400" : ""}`}>
          <SlidersHorizontal size={15} />
          Filters {activeFilterCount > 0 && <span className="badge bg-emerald-500/20 text-emerald-400">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="label-base">Category</label>
            <select value={filters.category} onChange={(e) => set("category", e.target.value)} className="input-base text-sm">
              <option value="">All Categories</option>
              {Object.keys(categories).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {filters.category && categories[filters.category] && (
            <div>
              <label className="label-base">Subcategory</label>
              <select value={filters.subcategory} onChange={(e) => set("subcategory", e.target.value)} className="input-base text-sm">
                <option value="">All</option>
                {categories[filters.category].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label-base">Location</label>
            <CitySearch value={filters.location} onChange={(v) => set("location", v)} placeholder="Any city" />
          </div>
          <div>
            <label className="label-base">Min Price (₹)</label>
            <input type="number" value={filters.min_price} onChange={(e) => set("min_price", e.target.value)}
              placeholder="0" className="input-base text-sm" />
          </div>
          <div>
            <label className="label-base">Max Price (₹)</label>
            <input type="number" value={filters.max_price} onChange={(e) => set("max_price", e.target.value)}
              placeholder="Any" className="input-base text-sm" />
          </div>
          <div>
            <label className="label-base">Min Rating</label>
            <select value={filters.min_rating} onChange={(e) => set("min_rating", e.target.value)} className="input-base text-sm">
              <option value="">Any</option>
              {[4.5, 4, 3.5, 3].map((r) => <option key={r} value={r}>{r}+ ★</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-red-400 transition-colors">
                <X size={14} /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category pills */}
      {Object.keys(categories).length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => set("category", "")}
            className={`badge transition-all ${!filters.category ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"}`}>
            All
          </button>
          {Object.keys(categories).map((c) => (
            <button key={c} onClick={() => set("category", c)}
              className={`badge transition-all ${filters.category === c ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Gig Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="skeleton h-48 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-display text-xl font-semibold text-zinc-300 mb-2">No gigs found</h3>
          <p className="text-zinc-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gigs.map((gig) => <GigCard key={gig.id} gig={gig} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all
                    ${filters.page === p ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
