import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { loadUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) { navigate("/login"); return; }

    authAPI.googleCallback(code)
      .then(({ data }) => {
        localStorage.setItem("access_token", data.access_token);
        return loadUser();
      })
      .then(() => {
        toast.success("Signed in with Google!");
        navigate("/dashboard");
      })
      .catch(() => {
        toast.error("Google sign-in failed");
        navigate("/login");
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Completing sign-in...</p>
      </div>
    </div>
  );
}
