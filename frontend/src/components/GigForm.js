import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { gigsAPI, metaAPI } from "../lib/api";
import CitySearch from "./CitySearch";
import { toast } from "sonner";

const EMPTY = {
  title: "", category: "", subcategory: "", description: "",
  basic_price: "", standard_price: "", premium_price: "",
  basic_desc: "", standard_desc: "", premium_desc: "",
  tags: [], location: "",
};

export default function GigForm({ gig, onClose, onSaved }) {
  const [form, setForm] = useState(gig ? {
    ...gig,
    basic_price: gig.basic_price?.toString(),
    standard_price: gig.standard_price?.toString(),
    premium_price: gig.premium_price?.toString(),
    tags: gig.tags || [],
  } : EMPTY);
  const [categories, setCategories] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    metaAPI.categories().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      setForm((p) => ({ ...p, tags: [...p.tags, t] }));
      setTagInput("");
    }
  };
  const removeTag = (t) => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.basic_price) {
      toast.error("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        basic_price: parseInt(form.basic_price) || 0,
        standard_price: parseInt(form.standard_price) || 0,
        premium_price: parseInt(form.premium_price) || 0,
      };
      if (gig) {
        await gigsAPI.update(gig.id, payload);
      } else {
        await gigsAPI.create(payload);
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="font-display text-xl font-bold text-zinc-100">{gig ? "Edit Gig" : "Create Gig"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="label-base">Gig Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required
              placeholder="e.g. Professional Wedding Photography in Mumbai" className="input-base" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Category *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} required className="input-base">
                <option value="">Select category</option>
                {Object.keys(categories).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Subcategory *</label>
              <select value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} required className="input-base"
                disabled={!form.category}>
                <option value="">Select subcategory</option>
                {(categories[form.category] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required
              placeholder="Describe your service in detail..." rows={4} className="input-base resize-none" />
          </div>

          <div>
            <label className="label-base">Location</label>
            <CitySearch value={form.location} onChange={(v) => set("location", v)} />
          </div>

          {/* Pricing tiers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Pricing Tiers</h3>
            {[
              { key: "basic", label: "Basic", color: "border-zinc-700" },
              { key: "standard", label: "Standard", color: "border-blue-500/30" },
              { key: "premium", label: "Premium", color: "border-amber-500/30" },
            ].map(({ key, label, color }) => (
              <div key={key} className={`p-4 rounded-xl border ${color} bg-zinc-800/30 space-y-3`}>
                <div className="font-medium text-sm text-zinc-300">{label} Package</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Price (₹) *</label>
                    <input type="number" value={form[`${key}_price`]}
                      onChange={(e) => set(`${key}_price`, e.target.value)}
                      placeholder="0" min="0" className="input-base" />
                  </div>
                  <div>
                    <label className="label-base">Description *</label>
                    <input value={form[`${key}_desc`]}
                      onChange={(e) => set(`${key}_desc`, e.target.value)}
                      placeholder="What's included" className="input-base" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <label className="label-base">Tags (up to 10)</label>
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                placeholder="Add a tag and press Enter" className="input-base flex-1 text-sm" />
              <button type="button" onClick={addTag} className="btn-secondary px-3">
                <Plus size={16} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <span key={t} className="badge bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : (gig ? "Update Gig" : "Create Gig")}
          </button>
        </div>
      </div>
    </div>
  );
}
