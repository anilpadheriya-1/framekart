import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, TrendingUp, Clock, CheckCircle, XCircle, IndianRupee, Camera, Edit2, Trash2, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardAPI, bookingsAPI, gigsAPI, reviewsAPI } from "../lib/api";
import { toast } from "sonner";
import GigForm from "../components/GigForm";
import StarRating from "../components/StarRating";

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

function StatCard({ label, value, icon: Icon, accent = "text-emerald-400" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-500 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className={`font-display text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showGigForm, setShowGigForm] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const load = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        dashboardAPI.stats(),
        bookingsAPI.list(),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);

      if (user.role === "provider") {
        const gigsRes = await gigsAPI.list({ limit: 50 });
        setGigs(gigsRes.data.gigs.filter((g) => g.provider_id === user.id || g.provider?.id === user.id));
      }
    } catch {}
  };

  useEffect(() => { load(); }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await bookingsAPI.updateStatus(id, status);
      toast.success(`Booking ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  const deleteGig = async (id) => {
    if (!window.confirm("Deactivate this gig?")) return;
    try {
      await gigsAPI.delete(id);
      toast.success("Gig deactivated");
      load();
    } catch { toast.error("Failed to delete gig"); }
  };

  const submitReview = async () => {
    try {
      await reviewsAPI.create({ gig_id: reviewModal.gig_id, booking_id: reviewModal.booking_id, ...reviewForm });
      toast.success("Review submitted!");
      setReviewModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Review failed");
    }
  };

  const isProvider = user.role === "provider";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Welcome back, {user.name}</p>
        </div>
        {isProvider && (
          <button onClick={() => { setEditingGig(null); setShowGigForm(true); }}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Gig
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 w-fit">
        {["overview", "bookings", isProvider && "my gigs"].filter(Boolean).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${activeTab === tab ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-zinc-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Bookings" value={stats.total_bookings || 0} icon={CheckCircle} />
            <StatCard label="Pending" value={stats.pending || 0} icon={Clock} accent="text-yellow-400" />
            {isProvider ? (
              <>
                <StatCard label="Revenue" value={`₹${(stats.revenue || 0).toLocaleString("en-IN")}`} icon={IndianRupee} accent="text-emerald-400" />
                <StatCard label="Active Gigs" value={stats.active_gigs || 0} icon={Camera} accent="text-blue-400" />
              </>
            ) : (
              <>
                <StatCard label="Completed" value={stats.completed || 0} icon={CheckCircle} accent="text-emerald-400" />
                <StatCard label="Total Spent" value={`₹${(stats.spent || 0).toLocaleString("en-IN")}`} icon={IndianRupee} accent="text-purple-400" />
              </>
            )}
          </div>

          {!isProvider && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-zinc-100 mb-1">Ready to earn?</h3>
                  <p className="text-zinc-400 text-sm">Become a provider and list your visual services for ₹99/month.</p>
                </div>
                <Link to="/subscription" className="btn-primary flex-shrink-0">Become a Pro</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {activeTab === "bookings" && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <div className="text-4xl mb-3">📋</div>
              <p>No bookings yet.</p>
              {!isProvider && <Link to="/gigs" className="text-emerald-400 hover:underline text-sm">Browse gigs</Link>}
            </div>
          ) : bookings.map((b) => (
            <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {b.gig?.images?.[0] && (
                    <img src={b.gig.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-medium text-zinc-100 mb-0.5">{b.gig?.title || "Deleted Gig"}</div>
                    <div className="text-sm text-zinc-500 capitalize">{b.tier} package · {b.event_date}</div>
                    <div className="text-emerald-400 font-mono font-bold text-sm mt-0.5">₹{b.price?.toLocaleString("en-IN")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge border ${STATUS_STYLES[b.status]} capitalize`}>{b.status}</span>
                  <div className="flex gap-2">
                    {isProvider && b.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(b.id, "accepted")}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all">
                          Accept
                        </button>
                        <button onClick={() => updateStatus(b.id, "rejected")}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
                          Reject
                        </button>
                      </>
                    )}
                    {isProvider && b.status === "accepted" && (
                      <button onClick={() => updateStatus(b.id, "completed")}
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all">
                        Mark Complete
                      </button>
                    )}
                    {!isProvider && b.status === "completed" && (
                      <button onClick={() => setReviewModal({ booking_id: b.id, gig_id: b.gig_id })}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all flex items-center gap-1">
                        <Star size={11} /> Review
                      </button>
                    )}
                    {["pending", "accepted"].includes(b.status) && (
                      <button onClick={() => updateStatus(b.id, "cancelled")}
                        className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {b.message && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-500 italic">"{b.message}"</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My Gigs (provider only) */}
      {activeTab === "my gigs" && isProvider && (
        <div className="space-y-3">
          {gigs.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <div className="text-4xl mb-3">🎨</div>
              <p className="mb-4">No gigs yet. Create your first!</p>
              <button onClick={() => setShowGigForm(true)} className="btn-primary">Create Gig</button>
            </div>
          ) : gigs.map((g) => (
            <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
              {g.images?.[0] && <img src={g.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-100 truncate">{g.title}</div>
                <div className="text-sm text-zinc-500">{g.subcategory} · {g.location}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-emerald-400 font-mono text-sm">from ₹{g.basic_price?.toLocaleString("en-IN")}</span>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Star size={11} className="fill-amber-400 text-amber-400" /> {g.rating?.toFixed(1)}
                    ({g.total_reviews})
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingGig(g); setShowGigForm(true); }}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteGig(g.id)}
                  className="p-2 rounded-lg bg-zinc-800 text-red-400 hover:text-red-300 transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gig Form Modal */}
      {showGigForm && (
        <GigForm
          gig={editingGig}
          onClose={() => { setShowGigForm(false); setEditingGig(null); }}
          onSaved={() => { setShowGigForm(false); setEditingGig(null); load(); toast.success(editingGig ? "Gig updated!" : "Gig created!"); }}
        />
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-zinc-100 mb-4">Leave a Review</h3>
            <div className="mb-4">
              <label className="label-base">Rating</label>
              <StarRating rating={reviewForm.rating} size={28} interactive onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} />
            </div>
            <div className="mb-4">
              <label className="label-base">Comment (optional)</label>
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder="Share your experience..." rows={3} className="input-base resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={submitReview} className="btn-primary flex-1">Submit Review</button>
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
