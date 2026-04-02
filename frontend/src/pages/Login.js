import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../lib/api";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      const { data } = await authAPI.googleUrl();
      window.location.href = data.url;
    } catch {
      toast.error("Google login unavailable");
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      await login("client@demo.com", "demo123");
      toast.success("Logged in as Demo Client!");
      navigate("/dashboard");
    } catch {
      toast.error("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-2xl mb-4">
            <Camera size={22} className="text-black" />
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-100 mb-1">Welcome back</h1>
          <p className="text-zinc-500">Sign in to your FrameKart account</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          {/* Google */}
          <button onClick={googleLogin}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-3 text-sm font-medium text-zinc-200 transition-all mb-4">
            <Chrome size={18} className="text-blue-400" />
            Continue with Google
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-zinc-900 text-xs text-zinc-600">or email</span></div>
          </div>

          <form onSubmit={submit} className="space-y-4">
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
                  placeholder="••••••••" className="input-base pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button onClick={demoLogin} disabled={loading}
            className="w-full mt-3 py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-all">
            Try Demo Account
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
