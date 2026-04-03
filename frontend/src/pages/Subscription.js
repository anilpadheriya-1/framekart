import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Camera, Star, Shield, TrendingUp, IndianRupee } from "lucide-react";
import { subscriptionAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const FEATURES = [
  "List unlimited gigs",
  "3 pricing tiers per gig (Basic / Standard / Premium)",
  "Cloudinary image hosting for portfolios",
  "Accept bookings from clients across India",
  "Messaging with clients",
  "Analytics dashboard",
  "Review & rating system",
  "Appear in search results",
];

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (user?.role === "provider" && user?.subscription_active) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Shield size={36} className="text-emerald-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2">You're a Pro!</h1>
        <p className="text-zinc-400 mb-6">Your subscription is active. Go manage your gigs.</p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  const subscribe = async () => {
    setLoading(true);
    try {
      const { data: order } = await subscriptionAPI.createOrder();

      if (order.mock) {
        // Dev mode: skip Razorpay, verify directly
        const { data } = await subscriptionAPI.verify({ mock: true });
        updateUser(data.user);
        toast.success("Subscription activated! Welcome to LensGigs Pro 🎉");
        navigate("/dashboard");
        return;
      }

      // Live Razorpay flow
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((res) => { script.onload = res; });
      }

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: "INR",
        name: "LensGigs",
        description: "Provider Subscription — ₹99/month",
        order_id: order.order_id,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#10b981" },
        handler: async (response) => {
          try {
            const { data } = await subscriptionAPI.verify(response);
            updateUser(data.user);
            toast.success("Subscription activated! Welcome to LensGigs Pro 🎉");
            navigate("/dashboard");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment initiation failed");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
          <Zap size={13} /> Provider Subscription
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-zinc-100 mb-4">
          Start Earning on<br />LensGigs
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          List your photography, videography, and editing services. Reach thousands of clients across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Pricing card */}
        <div className="gradient-border rounded-3xl p-8 bg-zinc-950">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-zinc-400 text-lg">₹</span>
            <span className="font-display text-6xl font-bold text-zinc-100">99</span>
            <span className="text-zinc-500">/month</span>
          </div>
          <p className="text-zinc-400 text-sm mb-6">Cancel anytime. No hidden fees.</p>

          <div className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </div>
                {f}
              </div>
            ))}
          </div>

          <button onClick={subscribe} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Processing...</>
            ) : (
              <><Zap size={18} /> Subscribe — ₹99/month</>
            )}
          </button>
          <p className="text-center text-xs text-zinc-600 mt-3">Secure payment via Razorpay</p>
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          {[
            { icon: Camera, title: "Showcase Your Work", desc: "Upload high-quality images for each gig with Cloudinary CDN. Make your portfolio stand out." },
            { icon: TrendingUp, title: "Grow Your Business", desc: "Get discovered by thousands of clients looking for visual professionals across India." },
            { icon: IndianRupee, title: "Set Your Prices", desc: "Create 3-tier pricing (Basic, Standard, Premium) for every gig. You're in control." },
            { icon: Star, title: "Build Your Reputation", desc: "Collect verified reviews and ratings from completed bookings to build trust." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-zinc-100 mb-1">{title}</div>
                <div className="text-sm text-zinc-500">{desc}</div>
              </div>
            </div>
          ))}

          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-xs text-zinc-600 text-center">
            🔒 Demo mode: Payment is mocked. Click Subscribe to instantly activate provider access.
          </div>
        </div>
      </div>
    </div>
  );
}
