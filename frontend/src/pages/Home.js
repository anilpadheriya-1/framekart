import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Star, Users, Camera, Video, Zap, BookOpen, Scissors } from "lucide-react";
import GigCard from "../components/GigCard";
import { gigsAPI } from "../lib/api";

const CATS = [
  { name: "Photography", icon: Camera, color: "from-rose-500/20 to-pink-500/10", accent: "text-rose-400", border: "border-rose-500/20" },
  { name: "Videography", icon: Video, color: "from-blue-500/20 to-cyan-500/10", accent: "text-blue-400", border: "border-blue-500/20" },
  { name: "Drone", icon: Zap, color: "from-yellow-500/20 to-orange-500/10", accent: "text-yellow-400", border: "border-yellow-500/20" },
  { name: "Album Design", icon: BookOpen, color: "from-purple-500/20 to-violet-500/10", accent: "text-purple-400", border: "border-purple-500/20" },
  { name: "Video Editing", icon: Scissors, color: "from-emerald-500/20 to-teal-500/10", accent: "text-emerald-400", border: "border-emerald-500/20" },
];

const STATS = [
  { label: "Visual Professionals", value: "2,400+", icon: Users },
  { label: "Gigs Available", value: "8,000+", icon: Camera },
  { label: "Happy Clients", value: "12,000+", icon: Star },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    gigsAPI.list({ limit: 6, sort: "popular" })
      .then(({ data }) => setFeatured(data.gigs))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/gigs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            India's #1 Visual Arts Marketplace
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-zinc-100 leading-[1.05] tracking-tight mb-6">
            Hire India's Best<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              Visual Artists
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Find top-rated photographers, videographers, drone operators, video editors, and album designers for your next project.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch}
            className="flex items-center gap-3 max-w-2xl mx-auto bg-zinc-900/80 border border-zinc-700 rounded-2xl p-2 backdrop-blur-sm focus-within:border-emerald-500/50 transition-colors">
            <Search size={18} className="ml-2 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search photographers, videographers, editors..."
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 outline-none text-sm sm:text-base"
            />
            <button type="submit" className="btn-primary flex-shrink-0 flex items-center gap-2">
              Search <ArrowRight size={15} />
            </button>
          </form>

          {/* Popular searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {["Wedding Photography", "4K Videography", "Drone Aerial", "Reel Editing"].map((t) => (
              <button key={t} onClick={() => navigate(`/gigs?search=${encodeURIComponent(t)}`)}
                className="text-xs text-zinc-500 hover:text-emerald-400 px-3 py-1 rounded-full border border-zinc-800 hover:border-emerald-500/30 transition-all">
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800/60 py-10 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-display text-3xl font-bold text-emerald-400">{value}</div>
              <div className="text-zinc-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-heading text-3xl mb-1">Browse by Category</h2>
              <p className="text-zinc-500 text-sm">Find the right professional for your needs</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATS.map(({ name, icon: Icon, color, accent, border }) => (
              <Link key={name} to={`/gigs?category=${encodeURIComponent(name)}`}
                className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${color} border ${border} hover:scale-[1.02] transition-all duration-300 group`}>
                <div className={`w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={accent} />
                </div>
                <div className={`font-semibold text-sm ${accent}`}>{name}</div>
                <ArrowRight size={14} className={`${accent} mt-1 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gigs */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-zinc-950/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="section-heading text-3xl mb-1">Featured Gigs</h2>
                <p className="text-zinc-500 text-sm">Top-rated professionals ready to work</p>
              </div>
              <Link to="/gigs" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((gig) => <GigCard key={gig.id} gig={gig} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="gradient-border rounded-3xl p-12 bg-zinc-950">
            <h2 className="font-display text-4xl font-bold text-zinc-100 mb-4">
              Are you a Visual Professional?
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Join FrameKart and reach thousands of clients across India. List your gigs for just ₹99/month.
            </p>
            <Link to="/subscription" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              <Zap size={18} />
              Start Selling — ₹99/month
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
