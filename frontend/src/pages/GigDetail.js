import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, MapPin, MessageSquare, ShoppingBag, Check, ChevronLeft, Calendar, User } from "lucide-react";
import StarRating from "../components/StarRating";
import { gigsAPI, bookingsAPI, messagesAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const TIER_COLORS = { basic: "border-zinc-700", standard: "border-blue-500/50 bg-blue-500/5", premium: "border-amber-500/50 bg-amber-500/5" };
const TIER_LABELS = { basic: "Basic", standard: "Standard", premium: "Premium" };
const TIER_BADGE = { basic: "bg-zinc-700 text-zinc-300", standard: "bg-blue-500/20 text-blue-400", premium: "bg-amber-500/20 text-amber-400" };

export default function GigDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState("basic");
  const [imgIdx, setImgIdx] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ event_date: "", message: "" });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    gigsAPI.get(id)
      .then(({ data }) => { setGig(data); setLoading(false); })
      .catch(() => { toast.error("Gig not found"); navigate("/gigs"); });
  }, [id, navigate]);

  const handleBook = async () => {
    if (!user) { toast.error("Please login to book"); navigate("/login"); return; }
    if (user.role !== "client") { toast.error("Only clients can book gigs"); return; }
    if (!bookingForm.event_date) { toast.error("Please select an event date"); return; }
    setBooking(true);
    try {
      await bookingsAPI.create({ gig_id: id, tier: selectedTier, ...bookingForm });
      toast.success("Booking request sent!");
      setShowBooking(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const handleMessage = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const { data } = await messagesAPI.getOrCreate(gig.provider.id);
      navigate(`/messages/${data.id}`);
    } catch {
      toast.error("Could not open conversation");
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="skeleton h-96 rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4"><div className="skeleton h-8 w-3/4" /><div className="skeleton h-40" /></div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!gig) return null;

  const images = gig.images?.length ? gig.images : ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800"];
  const tierPrice = gig[`${selectedTier}_price`];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to="/gigs" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Gigs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img src={images[imgIdx]} alt={gig.title}
              className="w-full h-80 object-cover"
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800"; }} />
            {images.length > 1 && (
              <div className="flex gap-2 p-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? "border-emerald-500" : "border-zinc-700 opacity-60"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-100">{gig.title}</h1>
              <span className="badge bg-zinc-800 text-zinc-400 border border-zinc-700 flex-shrink-0">{gig.subcategory}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-zinc-200 font-medium">{gig.rating?.toFixed(1) || "New"}</span>
                {gig.total_reviews > 0 && <span>({gig.total_reviews} reviews)</span>}
              </div>
              {gig.location && <div className="flex items-center gap-1"><MapPin size={14} />{gig.location}</div>}
              {gig.total_orders > 0 && <div className="flex items-center gap-1"><ShoppingBag size={14} />{gig.total_orders} orders</div>}
            </div>
          </div>

          {/* Provider */}
          {gig.provider && (
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-3">
                {gig.provider.avatar
                  ? <img src={gig.provider.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">{gig.provider.name?.[0]}</div>
                }
                <div>
                  <div className="font-semibold text-zinc-100">{gig.provider.name}</div>
                  <div className="text-sm text-zinc-500">{gig.provider.city || "India"}</div>
                  {gig.provider.rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs text-zinc-400">{gig.provider.rating?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              {user && user.id !== gig.provider?.id && (
                <button onClick={handleMessage} className="btn-secondary flex items-center gap-2 text-sm">
                  <MessageSquare size={14} /> Message
                </button>
              )}
            </div>
          )}

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <h2 className="font-display text-xl font-bold text-zinc-100 mb-3">About this Gig</h2>
            <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{gig.description}</p>
          </div>

          {/* Tags */}
          {gig.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gig.tags.map((t) => (
                <span key={t} className="badge bg-zinc-800 text-zinc-400 border border-zinc-700">#{t}</span>
              ))}
            </div>
          )}

          {/* Reviews */}
          {gig.reviews?.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-zinc-100 mb-4">Reviews</h2>
              <div className="space-y-4">
                {gig.reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      {r.client?.avatar
                        ? <img src={r.client.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400"><User size={14} /></div>
                      }
                      <div>
                        <div className="text-sm font-medium text-zinc-200">{r.client?.name || "Client"}</div>
                        <StarRating rating={r.rating} size={12} />
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-zinc-400">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Tier selector */}
            <div className="p-5 border-b border-zinc-800">
              <div className="flex gap-2 mb-4">
                {["basic", "standard", "premium"].map((tier) => (
                  <button key={tier} onClick={() => setSelectedTier(tier)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border
                      ${selectedTier === tier ? TIER_BADGE[tier] + " border-current" : "text-zinc-500 border-zinc-700 hover:border-zinc-600"}`}>
                    {TIER_LABELS[tier]}
                  </button>
                ))}
              </div>

              {["basic", "standard", "premium"].map((tier) => (
                selectedTier === tier && (
                  <div key={tier} className={`p-4 rounded-xl border ${TIER_COLORS[tier]}`}>
                    <div className="text-2xl font-bold text-emerald-400 font-mono mb-2">
                      ₹{gig[`${tier}_price`]?.toLocaleString("en-IN")}
                    </div>
                    <p className="text-sm text-zinc-400">{gig[`${tier}_desc`]}</p>
                  </div>
                )
              ))}
            </div>

            <div className="p-5 space-y-3">
              {!showBooking ? (
                <>
                  <button onClick={() => { if (!user) { navigate("/login"); return; } setShowBooking(true); }}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    <ShoppingBag size={16} />
                    Book Now — ₹{tierPrice?.toLocaleString("en-IN")}
                  </button>
                  {user && user.id !== gig.provider?.id && (
                    <button onClick={handleMessage} className="btn-secondary w-full flex items-center justify-center gap-2">
                      <MessageSquare size={16} /> Message Provider
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-zinc-200">Booking Details</h3>
                  <div>
                    <label className="label-base">Event Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input type="date" value={bookingForm.event_date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setBookingForm((p) => ({ ...p, event_date: e.target.value }))}
                        className="input-base pl-9 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="label-base">Message (optional)</label>
                    <textarea value={bookingForm.message}
                      onChange={(e) => setBookingForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Tell the provider about your event..."
                      rows={3} className="input-base text-sm resize-none" />
                  </div>
                  <button onClick={handleBook} disabled={booking} className="btn-primary w-full">
                    {booking ? "Sending..." : `Confirm Booking — ₹${tierPrice?.toLocaleString("en-IN")}`}
                  </button>
                  <button onClick={() => setShowBooking(false)} className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* What's included */}
            <div className="px-5 pb-5">
              <div className="pt-4 border-t border-zinc-800 space-y-1.5">
                {["Revisions included", "Direct communication", "On-time delivery"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
