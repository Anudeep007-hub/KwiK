"use client";

import { useState } from "react";

const mono = "var(--font-mono, 'JetBrains Mono', monospace)";

export function SettingsPage() {
  const [name, setName] = useState("user_01");
  const [email, setEmail] = useState("user@example.com");
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              },
              {
                label: "Email Address",
                value: email,
                setter: setEmail,
                type: "email",
                placeholder: "you@example.com",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5 uppercase tracking-wide">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full h-9 px-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827]"
                />
              </div>
            ))}
            <div className="pt-1">
              <button
                onClick={handleSave}
                className="h-9 px-4 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] transition-colors"
              >
                {saved ? "Saved" : "Save Changes"}
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
                  Created Jun 1, 2025 · Last used 2 hours ago
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <code
                  className="text-xs bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-1.5 rounded text-[#6B7280] select-all"
                  style={{ fontFamily: mono }}
                >
                  {revealed
                    ? "kwk_prod_4f2a8b3c9e1d7f6a2b5c8e3d1f4a7b9c"
                    : "kwk_prod_••••••••••••••••••••••••••••4f2a"}
                </code>
                <button
                  onClick={() => setRevealed((v) => !v)}
                  className="h-8 px-3 text-xs font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151]"
                >
                  {revealed ? "Hide" : "Reveal"}
                </button>
                <button className="h-8 px-3 text-xs font-medium border border-[#FCA5A5] text-[#DC2626] rounded hover:bg-[#FEF2F2] transition-colors">
                  Revoke
                </button>
              </div>
            </div>
            <div className="border-t border-[#F3F4F6] pt-4">
              <button className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151]">
                + Generate New Key
              </button>
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
                className="flex-1 h-9 px-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827] placeholder:text-[#9CA3AF]"
              />
              <button className="h-9 px-4 text-sm font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151] whitespace-nowrap">
                Add Endpoint
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Events: <code style={{ fontFamily: mono }}>click.created</code>,{" "}
              <code style={{ fontFamily: mono }}>link.disabled</code>,{" "}
              <code style={{ fontFamily: mono }}>link.expired</code>
            </p>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="border border-[#FCA5A5] rounded overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#FCA5A5] bg-[#FEF2F2]">
            <h2 className="text-sm font-semibold text-[#DC2626]">
              Danger Zone
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-[#111827]">
                Delete Account
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Permanently delete your account and all associated links. This
                action cannot be undone.
              </p>
            </div>
            <button className="h-9 px-4 text-sm font-medium border border-[#FCA5A5] text-[#DC2626] rounded hover:bg-[#FEF2F2] transition-colors whitespace-nowrap shrink-0">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
