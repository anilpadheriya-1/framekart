import React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, ShoppingBag } from "lucide-react";

const CATEGORY_ICONS = {
  Photography: "📸", Videography: "🎬", "Video Editing": "✂️", Drone: "🚁", "Album Design": "📖"
};

export default function GigCard({ gig }) {
  const img = gig.images?.[0] || `https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600`;

  return (
    <Link to={`/gigs/${gig.id}`} className="gig-card block group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-zinc-800">
        <img src={img} alt={gig.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600"; }}
        />
        <div className="absolute top-3 left-3">
          <span className="badge bg-black/70 backdrop-blur-sm text-zinc-200 border border-zinc-700/50">
            {CATEGORY_ICONS[gig.category] || "🎨"} {gig.subcategory}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Provider */}
        {gig.provider && (
          <div className="flex items-center gap-2 mb-2">
            {gig.provider.avatar
              ? <img src={gig.provider.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              : <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                  {gig.provider.name?.[0]?.toUpperCase()}
                </div>
            }
            <span className="text-xs text-zinc-400 font-medium">{gig.provider.name}</span>
          </div>
        )}

        <h3 className="font-semibold text-zinc-100 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-emerald-400 transition-colors">
          {gig.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-zinc-300 font-medium">{gig.rating?.toFixed(1) || "New"}</span>
            {gig.total_reviews > 0 && <span>({gig.total_reviews})</span>}
          </div>
          {gig.location && (
            <div className="flex items-center gap-1">
              <MapPin size={11} />
              {gig.location}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Starting at</span>
            <div className="text-emerald-400 font-bold text-base font-mono">
              ₹{gig.basic_price?.toLocaleString("en-IN")}
            </div>
          </div>
          {gig.total_orders > 0 && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <ShoppingBag size={11} />
              {gig.total_orders} orders
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
