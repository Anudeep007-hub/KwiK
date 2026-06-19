"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as linkService from "@/services/linkService";

const mono = "var(--font-mono, 'JetBrains Mono', monospace)";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProvider(user.provider || "");
      setIsLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      await linkService.updateUserProfile(name);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-60"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#111827]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Manage your account, API keys, and preferences.
        </p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">
        {/* Account */}
        <section className="border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="text-sm font-semibold text-[#111827]">Account</h2>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {[
              {
                label: "Display Name",
                value: name,
                setter: setName,
                type: "text",
                placeholder: "Your name",
                editable: true,
              },
              {
                label: "Email Address",
                value: email,
                setter: setEmail,
                type: "email",
                placeholder: "you@example.com",
                editable: false,
              },
              {
                label: "Provider",
                value: provider.charAt(0).toUpperCase() + provider.slice(1),
                setter: () => {},
                type: "text",
                placeholder: "Provider",
                editable: false,
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5 uppercase tracking-wide">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => {
                    if (field.editable) field.setter(e.target.value);
                  }}
                  placeholder={field.placeholder}
                  disabled={!field.editable}
                  className={`w-full h-9 px-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827] ${
                    !field.editable ? "bg-[#F9FAFB] cursor-not-allowed" : ""
                  }`}
                />
              </div>
            ))}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="pt-1">
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

        {/* API Keys */}
        <section className="border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="text-sm font-semibold text-[#111827]">API Keys</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Use these keys to authenticate requests to the KwiK API.
            </p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Production Key
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Coming soon
                </p>
              </div>
              <div className="text-xs text-[#9CA3AF]">
                API key generation feature coming soon
              </div>
            </div>
          </div>
        </section>

        {/* Webhooks */}
        <section className="border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <h2 className="text-sm font-semibold text-[#111827]">Webhooks</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Receive real-time click events via HTTP POST.
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://your-server.com/webhook"
                disabled
                className="flex-1 h-9 px-3 text-sm border border-[#E5E7EB] rounded bg-[#F9FAFB] text-[#6B7280] placeholder:text-[#9CA3AF] cursor-not-allowed"
              />
              <button disabled className="h-9 px-4 text-sm font-medium border border-[#E5E7EB] rounded text-[#9CA3AF] whitespace-nowrap cursor-not-allowed">
                Add Endpoint
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Webhooks feature coming soon
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
