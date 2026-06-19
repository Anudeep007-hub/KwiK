"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ExternalLink } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Link as LinkType, LinkStatus } from "../../types/api";
import { getShortUrl } from "../../services/apiConfig";
import { createShortLink, getLinks } from "../../services/linkService";

const mono = "var(--font-mono, 'JetBrains Mono', monospace)";

export const StatusBadge = ({ status }: { status: LinkStatus }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      status === "ACTIVE"
        ? "bg-[#DCFCE7] text-[#16A34A]"
        : "bg-[#F3F4F6] text-[#6B7280]"
    }`}
  >
    <span
      className={`size-1.5 rounded-full ${
        status === "ACTIVE" ? "bg-[#16A34A]" : "bg-[#9CA3AF]"
      }`}
    />
    {status === "ACTIVE" ? "Active" : "Disabled"}
  </span>
);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
};

export function LinksPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [newUrl, setNewUrl] = useState("");
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    getLinks()
      .then((data) => {
        if (active) setLinks(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load links");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = links.filter((l) => {
    const matchSearch =
      l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      l.longUrl.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const handleCreate = async () => {
    if (!newUrl.trim()) return;

    setCreating(true);
    setError("");

    try {
      const { shortCode } = await createShortLink(newUrl.trim());
      const newLink: LinkType = {
        shortCode,
        longUrl: newUrl.trim(),
        createdAt: new Date().toISOString(),
        expiresAt: null,
        status: "ACTIVE",
        ownerId: null,
        clickCount: 0,
      };
      setLinks((prev) => [newLink, ...prev]);
      setNewUrl("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create short link");
    } finally {
      setCreating(false);
    }
  };

  const counts = {
    ALL: links.length,
    ACTIVE: links.filter((l) => l.status === "ACTIVE").length,
    DISABLED: links.filter((l) => l.status === "DISABLED").length,
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Links</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {loading ? "Loading links..." : `${counts.ACTIVE} active · ${counts.DISABLED} disabled`}
          </p>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-1.5 h-9 px-4 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] transition-colors duration-100">
              <Plus size={14} />
              New Link
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/25 z-30" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#E5E7EB] rounded-lg p-6 w-full max-w-md z-40 shadow-sm">
              <Dialog.Title className="text-base font-semibold text-[#111827] mb-4">
                Create a new short link
              </Dialog.Title>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5 uppercase tracking-wide">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/long/path/to/resource"
                    className="w-full h-9 px-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827] placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newUrl.trim()}
                    className="flex-1 h-9 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] disabled:opacity-40 transition-colors"
                  >
                    {creating ? "Creating..." : "Create Link"}
                  </button>
                  <Dialog.Close asChild>
                    <button className="h-9 px-4 text-sm font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151]">
                      Cancel
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or URL…"
            className="w-64 h-9 pl-8 pr-3 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827] placeholder:text-[#9CA3AF]"
          />
        </div>
        <div className="flex items-center border border-[#E5E7EB] rounded overflow-hidden">
          {(["ALL", "ACTIVE", "DISABLED"] as const).map((f, i) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-3.5 text-xs font-medium transition-colors duration-100 ${
                filter === f
                  ? "bg-[#F3F4F6] text-[#111827]"
                  : "bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]"
              } ${i > 0 ? "border-l border-[#E5E7EB]" : ""}`}
            >
              {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : "Disabled"}{" "}
              <span className="text-[#9CA3AF] font-normal">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Short URL
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Destination
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Created
              </th>
              <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Clicks
              </th>
              <th className="py-2.5 px-4 w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((link, i) => (
              <tr
                key={link.shortCode}
                onClick={() => router.push(`/links/${link.shortCode}`)}
                className={`cursor-pointer hover:bg-[#F9FAFB] transition-colors duration-100 group ${
                  i < filtered.length - 1 ? "border-b border-[#E5E7EB]" : ""
                }`}
              >
                <td className="py-3 px-4">
                  <span
                    className="text-[#2563EB] text-xs font-medium group-hover:underline"
                    style={{ fontFamily: mono }}
                  >
                    {getShortUrl(link.shortCode)}
                  </span>
                </td>
                <td className="py-3 px-4 max-w-[280px]">
                  <span
                    className="text-[#6B7280] text-xs truncate block"
                    title={link.longUrl}
                  >
                    {link.longUrl.replace(/https?:\/\//, "")}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={link.status} />
                </td>
                <td className="py-3 px-4">
                  <span className="text-[#9CA3AF] text-xs">
                    {timeAgo(link.createdAt)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className="text-[#111827] text-xs font-semibold tabular-nums"
                    style={{ fontFamily: mono }}
                  >
                    {link.clickCount.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <a
                    href={getShortUrl(link.shortCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-14 text-center text-sm text-[#9CA3AF]"
                >
                  No links match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
