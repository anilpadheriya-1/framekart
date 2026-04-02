import React, { useState, useRef } from "react";
import { User, Camera, MapPin, FileText, Save, Upload } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../lib/api";
import CitySearch from "../components/CitySearch";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name || "", city: user.city || "", bio: user.bio || "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersAPI.updateProfile(form);
      updateUser(data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5MB"); return; }
    setUploading(true);
    try {
      const { data } = await usersAPI.uploadAvatar(file);
      updateUser({ avatar: data.avatar });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const roleBadge = user.role === "provider"
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-100">Profile Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="relative">
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            : <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <User size={32} className="text-emerald-400" />
              </div>
          }
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors">
            {uploading
              ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              : <Camera size={13} className="text-black" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </div>
        <div>
          <div className="font-display text-xl font-bold text-zinc-100">{user.name}</div>
          <div className="text-zinc-500 text-sm">{user.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge border capitalize ${roleBadge}`}>{user.role}</span>
            {user.subscription_active && (
              <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={save} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="label-base">Full Name</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Your name" className="input-base pl-9" />
          </div>
        </div>

        <div>
          <label className="label-base">City</label>
          <CitySearch value={form.city} onChange={(v) => set("city", v)} />
        </div>

        <div>
          <label className="label-base">Bio</label>
          <div className="relative">
            <FileText size={15} className="absolute left-3 top-3 text-zinc-500" />
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
              placeholder={user.role === "provider" ? "Tell clients about your experience and style..." : "A bit about yourself..."}
              rows={4} className="input-base pl-9 resize-none" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
        </button>
      </form>

      {/* Account info */}
      <div className="mt-6 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Email</span><span className="text-zinc-300">{user.email}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Role</span><span className="capitalize text-zinc-300">{user.role}</span>
        </div>
        {user.subscription_expires && (
          <div className="flex justify-between text-zinc-400">
            <span>Subscription expires</span>
            <span className="text-zinc-300">{new Date(user.subscription_expires).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
