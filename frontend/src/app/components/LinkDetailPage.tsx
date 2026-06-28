"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, XCircle, BarChart2, ArrowLeft, CircleOff } from "lucide-react";
import type { ClickEvent, Link as LinkType, LinkStatus } from "../../types/api";
import { StatusBadge } from "./LinksPage";
import { getShortUrl } from "../../services/apiConfig";
import { getClickEvents, getLink, updateLinkStatus, updateLongUrl, deleteLink } from "../../services/linkService";


const mono = "var(--font-mono, 'JetBrains Mono', monospace)";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export function LinkDetailPage() {
  const params = useParams<{ shortCode: string }>();
  const shortCode = params.shortCode;
  const router = useRouter();

  const [link, setLink] = useState<LinkType | null>(null);
  const [events, setEvents] = useState<ClickEvent[]>([]);
  const [status, setStatus] = useState<LinkStatus>("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState("");

  useEffect(() => {
    let active = true;

    if (!shortCode) {
      setLink(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    getLink(shortCode)
      .then((data) => {
        if (!active) return;
        setLink(data);
        setEditedUrl(data.longUrl);
        setStatus(data.status);
      })
      .catch((err) => {
        if (!active) return;
        setLink(null);
        setError(err instanceof Error ? err.message : "Unable to load link");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getClickEvents(shortCode)
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load click events");
      });

    return () => {
      active = false;
    };
  }, [shortCode]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-[#9CA3AF]">Loading link...</p>
      </main>
    );
  }

  if (!link) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/links")}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Links
        </button>
        <p className="text-sm text-[#9CA3AF]">
          {error || "Link not found"}: <code style={{ fontFamily: mono }}>{shortCode}</code>
        </p>
      </main>
    );
  }

  const shortUrl = getShortUrl(shortCode ?? link.shortCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uniqueCountries = new Set(events.map((e) => e.country).filter(Boolean)).size;
  const today = events.filter(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={() => router.push("/links")}
        className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors duration-100"
      >
        <ArrowLeft size={14} />
        Back to Links
      </button>

      {/* Header */}
      <div className="pb-6 mb-6 border-b border-[#E5E7EB]">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-[#2563EB] no-underline hover:underline"
                style={{ fontFamily: mono }}
              >
                {shortUrl}
              </a>
              <StatusBadge status={status} />
            </div>
            {/* <p className="text-sm text-[#6B7280] mb-1 break-all">{link.longUrl}</p> */}
            {editing ? (
              <div className="flex gap-2 mt-2">
                <input
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="border rounded px-2 py-1 flex-1"
                />

                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={async () => {
                    await updateLongUrl(link.shortCode, editedUrl);

                    setLink({
                      ...link,
                      longUrl: editedUrl,
                    });

                    setEditing(false);
                  }}
                >
                  Save
                </button>

                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => {
                    setEditedUrl(link.longUrl);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] mb-1 break-all">
                {link.longUrl}
              </p>
            )}
            <p className="text-xs text-[#9CA3AF]">
              Created {formatDate(link.createdAt)}
              {link.expiresAt && ` · Expires ${formatDate(link.expiresAt)}`}
              {link.ownerId && ` · ${link.ownerId}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151]"
            >
              {copied ? (
                <Check size={13} className="text-[#16A34A]" />
              ) : (
                <Copy size={13} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151] no-underline"
            >
              <ExternalLink size={13} />
              Open Short URL
            </a>
            <button
              onClick={async () => {
                try {
                  const newStatus =
                    status === "ACTIVE" ? "DISABLED" : "ACTIVE";

                  await updateLinkStatus(link.shortCode, newStatus);

                  setStatus(newStatus);
                } catch (err) {
                  console.error(err);
                }
              }}
              className={`flex items-center gap-1.5 h-9 px-3 text-sm font-medium border rounded transition-colors ${status === "ACTIVE"
                ? "border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]"
                : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
            >
              {status === "ACTIVE" ? (
                <>
                  <XCircle size={13} />
                  Disable
                </>
              ) : (
                <>
                  <CircleOff size={13} />
                  Enable
                </>
              )}
            </button>
            <button
              onClick={async () => {
                if (!confirm("Delete this link?")) return;

                await deleteLink(link.shortCode);

                router.push("/links");
              }}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Delete
            </button>
            <button
              onClick={() => router.push("/analytics")}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-semibold bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-colors"
            >
              <BarChart2 size={13} />
              Analytics
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB]"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Clicks", value: link.clickCount.toLocaleString(), isMono: true },
          { label: "Countries", value: uniqueCountries > 0 ? uniqueCountries.toString() : "—", isMono: true },
          { label: "Clicks Today", value: today.toString(), isMono: true },
        ].map((s) => (
          <div key={s.label} className="border border-[#E5E7EB] rounded px-5 py-4">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
              {s.label}
            </p>
            <p
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: s.isMono ? mono : "inherit" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Click events table */}
      <div className="border border-[#E5E7EB] rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <h2 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Click Events
          </h2>
          <span className="text-[11px] text-[#9CA3AF]">{events.length} recorded</span>
        </div>
        {events.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#9CA3AF]">
            No click events recorded for this link yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {[
                    "Timestamp",
                    "Country",
                    "Region",
                    "City",
                    "Timezone",
                    "ISP",
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left py-2.5 px-4 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <tr
                    key={event.eventId}
                    className={`hover:bg-[#F9FAFB] transition-colors duration-100 ${i < events.length - 1 ? "border-b border-[#F3F4F6]" : ""
                      }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap" style={{ fontFamily: mono }}>
                      <span className="text-[#6B7280]">{formatDateTime(event.timestamp)}</span>
                    </td>
                    <td className="py-3 px-4 text-[#111827] whitespace-nowrap">
                      {event.country ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                      {event.region ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#111827] whitespace-nowrap">
                      {event.city ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap" style={{ fontFamily: mono }}>
                      {event.timezone ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {event.isp ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
