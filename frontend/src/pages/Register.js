import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import CitySearch from "../components/CitySearch";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client", city: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.city);
      toast.success("Account created!");
      navigate(user.role === "provider" ? "/dashboard" : "/gigs");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-2xl mb-4">
            <Camera size={22} className="text-black" />
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-100 mb-1">Join LensGigs</h1>
          <p className="text-zinc-500">India's premier visual arts marketplace</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          {/* Role toggle */}
          <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl mb-6">
            {["client", "provider"].map((r) => (
              <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, role: r }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all
                  ${form.role === r ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-zinc-200"}`}>
                {r === "client" ? "👤 Hire Talent" : "🎨 Sell Services"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-base">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="name" value={form.name} onChange={handle} required
                  placeholder="Arjun Mehta" className="input-base pl-9" />
              </div>
            </div>
            <div>
              <label className="label-base">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="email" type="email" value={form.email} onChange={handle} required
                  placeholder="you@example.com" className="input-base pl-9" />
              </div>
            </div>
            <div>
              <label className="label-base">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="password" type={showPw ? "text" : "password"} value={form.password} onChange={handle} required
                  placeholder="Min 6 characters" className="input-base pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label-base">City</label>
              <CitySearch value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />
            </div>

            {form.role === "provider" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
                ⚡ Provider subscription: ₹99/month. You'll be prompted to subscribe after registration.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
