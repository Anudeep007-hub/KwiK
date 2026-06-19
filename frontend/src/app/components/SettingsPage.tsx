"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as linkService from "@/services/linkService";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleSave = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setError("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await linkService.updateUserProfile(nextName);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#111827]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Update your display name.</p>
      </div>

      <section className="max-w-2xl border border-[#E5E7EB] rounded overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h2 className="text-sm font-semibold text-[#111827]">Account</h2>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full h-9 px-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827]"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
