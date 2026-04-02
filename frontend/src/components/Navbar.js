import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Camera, MessageSquare, LayoutDashboard, LogOut, User, Menu, X, Bell, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { messagesAPI } from "../lib/api";
import { toast } from "sonner";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data } = await messagesAPI.unreadCount();
        setUnread(data.count);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const navLink = (to, label, icon) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${isActive(to)
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
              <Camera size={16} className="text-black" />
            </div>
            <span className="font-display font-bold text-lg text-zinc-100">
              Frame<span className="text-emerald-400">Kart</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink("/gigs", "Browse", null)}
            {user && navLink("/dashboard", "Dashboard", <LayoutDashboard size={15} />)}
            {user && (
              <Link
                to="/messages"
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive("/messages") ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`}
              >
                <MessageSquare size={15} />
                Messages
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role === "client" && (
                  <Link to="/subscription"
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all">
                    <Zap size={12} />
                    Become a Pro
                  </Link>
                )}
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    : <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><User size={12} className="text-emerald-400" /></div>
                  }
                  <span className="text-sm font-medium max-w-24 truncate">{user.name}</span>
                </Link>
                <button onClick={handleLogout}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all">Log in</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/95 px-4 py-3 space-y-1">
          {navLink("/gigs", "Browse Gigs", null)}
          {user && navLink("/dashboard", "Dashboard", <LayoutDashboard size={15} />)}
          {user && navLink("/messages", "Messages", <MessageSquare size={15} />)}
          {user ? (
            <>
              {navLink("/profile", "Profile", <User size={15} />)}
              {user.role === "client" && navLink("/subscription", "Become a Pro", <Zap size={15} />)}
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              {navLink("/login", "Log in", null)}
              {navLink("/register", "Get Started", null)}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
