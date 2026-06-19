"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type { ClickEvent, Link as LinkType } from "../../types/api";
import { getClickEvents, getLinks } from "../../services/linkService";

const mono = "var(--font-mono, 'JetBrains Mono', monospace)";

const parseUA = (ua: string): { browser: string; device: string } => {
  if (/curl/i.test(ua)) return { browser: "curl", device: "CLI" };
  if (/python/i.test(ua)) return { browser: "Python", device: "CLI" };
  if (/Go-http/i.test(ua)) return { browser: "Go", device: "CLI" };
  if (/PostmanRuntime/i.test(ua)) return { browser: "Postman", device: "CLI" };
  if (/Firefox/i.test(ua)) return { browser: "Firefox", device: "Desktop" };
  if (/iPhone|Android/i.test(ua))
    return { browser: /Safari/i.test(ua) ? "Safari" : "Chrome", device: "Mobile" };
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua))
    return { browser: "Safari", device: "Desktop" };
  if (/Chrome/i.test(ua)) return { browser: "Chrome", device: "Desktop" };
  return { browser: "Other", device: "Desktop" };
};

const aggregate = (values: (string | null)[]) => {
  const map: Record<string, number> = {};
  values.forEach((v) => {
    if (v) map[v] = (map[v] ?? 0) + 1;
  });
  const total = values.filter(Boolean).length;
  if (total === 0) return [];

  return Object.entries(map)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
};

const getDailyClicks = (events: ClickEvent[]) => {
  const counts = new Map<string, number>();

  events.forEach((event) => {
    const key = new Date(event.timestamp).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      date: key.slice(5),
      clicks: counts.get(key) ?? 0,
    };
  });
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const ChartTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded px-3 py-2 shadow-sm">
      <p className="text-xs text-[#9CA3AF] mb-0.5">{label}</p>
      <p
        className="text-sm font-semibold text-[#111827]"
        style={{ fontFamily: mono }}
      >
        {payload[0].value.toLocaleString()} clicks
      </p>
    </div>
  );
};

interface DistProps {
  title: string;
  data: Array<{ name: string; count: number; pct: number }>;
}

const DistTable = ({ title, data }: DistProps) => (
  <div className="border border-[#E5E7EB] rounded overflow-hidden">
    <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
      <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <table className="w-full">
      <tbody>
        {data.slice(0, 7).map((item, i) => (
          <tr
            key={item.name}
            className={`hover:bg-[#F9FAFB] transition-colors duration-100 ${
              i < Math.min(data.length, 7) - 1 ? "border-b border-[#F3F4F6]" : ""
            }`}
          >
            <td className="py-2.5 px-4 w-7">
              <span className="text-[11px] text-[#9CA3AF]" style={{ fontFamily: mono }}>
                {i + 1}
              </span>
            </td>
            <td className="py-2.5 px-4 text-sm text-[#111827]">{item.name}</td>
            <td className="py-2.5 px-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span
                  className="text-[11px] text-[#9CA3AF] w-7 text-right tabular-nums shrink-0"
                  style={{ fontFamily: mono }}
                >
                  {item.pct}%
                </span>
              </div>
            </td>
            <td className="py-2.5 px-4 text-right">
              <span
                className="text-xs font-semibold text-[#374151] tabular-nums"
                style={{ fontFamily: mono }}
              >
                {item.count}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function AnalyticsPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedShortCode, setSelectedShortCode] = useState<string>("ALL");
  const [events, setEvents] = useState<ClickEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getLinks()
      .then((data) => {
        if (active) setLinks(data);
      })
      .catch(() => {
        // Links list is optional for the analytics selector.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchEvents = () => {
      getClickEvents(selectedShortCode === "ALL" ? undefined : selectedShortCode)
        .then((data) => {
          if (active) setEvents(data);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Unable to load analytics");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchEvents();
    timer = setInterval(fetchEvents, 10000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [selectedShortCode]);

  const dailyClicks = getDailyClicks(events);
  const totalClicks = events.length;

  const countries = aggregate(events.map((e) => e.country));
  const cities = aggregate(
    events.map((e) => (e.city && e.country ? `${e.city}, ${e.country}` : e.city))
  );
  const isps = aggregate(events.map((e) => e.isp));
  const browsers = aggregate(events.map((e) => parseUA(e.userAgent).browser));
  const devices = aggregate(events.map((e) => parseUA(e.userAgent).device));

  const topCountry = countries[0]?.name ?? "—";
  const topCity = cities[0]?.name.split(",")[0] ?? "—";
  const topISP = isps[0]?.name ?? "—";

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">Analytics</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {selectedShortCode === "ALL" ? "All links" : `Link /${selectedShortCode}`} · Last 30 days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-target" className="text-sm text-[#6B7280] font-medium">
              View analytics for
            </label>
            <select
              id="analytics-target"
              value={selectedShortCode}
              onChange={(e) => setSelectedShortCode(e.target.value)}
              className="h-10 px-3 text-sm border border-[#E5E7EB] rounded bg-white text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
            >
              <option value="ALL">All links</option>
              {links.map((link) => (
                <option key={link.shortCode} value={link.shortCode}>
                  /{link.shortCode} {link.longUrl.replace(/^https?:\/\//, "")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="mb-4 text-sm text-[#9CA3AF]">Loading analytics...</p>}
      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      {/* Top metrics */}
      <div className="border border-[#E5E7EB] rounded overflow-hidden mb-6">
        <div className="grid grid-cols-5 divide-x divide-[#E5E7EB]">
          {[
            { label: "Total Clicks", value: totalClicks.toLocaleString(), mono: true },
            { label: "Countries", value: countries.length.toString(), mono: true },
            { label: "Top Country", value: topCountry, mono: false },
            { label: "Top City", value: topCity, mono: false },
            { label: "Top ISP", value: topISP, mono: false },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p
                className="font-bold text-[#111827] leading-tight truncate"
                style={{
                  fontFamily: stat.mono ? mono : "inherit",
                  fontSize: stat.mono ? "24px" : "18px",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic chart */}
      <div className="border border-[#E5E7EB] rounded overflow-hidden mb-6">
        <div className="px-6 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111827]">Traffic over time</h2>
          <span className="text-xs text-[#9CA3AF]">Daily clicks</span>
        </div>
        <div className="pr-4 pt-4 pb-1">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={dailyClicks}
              margin={{ top: 5, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#F3F4F6"
                vertical={false}
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: mono }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: mono }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#2563EB"
                strokeWidth={1.5}
                fill="#2563EB"
                fillOpacity={0.05}
                dot={false}
                activeDot={{ r: 3, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution tables */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DistTable title="Countries" data={countries} />
        <DistTable title="Cities" data={cities} />
        <DistTable title="ISPs / Networks" data={isps} />
        <div className="flex flex-col gap-4">
          <DistTable title="Browsers" data={browsers} />
          <DistTable title="Devices" data={devices} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="border border-[#E5E7EB] rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Recent Activity
          </h3>
          <span className="text-[11px] text-[#9CA3AF]">
            {events.length} events today
          </span>
        </div>
        <div>
          {events.slice(0, 10).map((event, i) => {
            const { browser, device } = parseUA(event.userAgent);
            const client = device === "CLI" ? browser : device;
            return (
              <div
                key={event.eventId}
                className={`flex items-center gap-5 px-4 py-2.5 text-xs hover:bg-[#F9FAFB] transition-colors duration-100 ${
                  i < 9 ? "border-b border-[#F3F4F6]" : ""
                }`}
              >
                <span
                  className="text-[#9CA3AF] tabular-nums w-11 shrink-0"
                  style={{ fontFamily: mono }}
                >
                  {formatTime(event.timestamp)}
                </span>
                <span
                  className="text-[#2563EB] font-semibold w-24 shrink-0 truncate"
                  style={{ fontFamily: mono }}
                >
                  /{event.shortCode}
                </span>
                <span className="text-[#374151] flex-1 truncate">
                  {event.city && event.country
                    ? `${event.city}, ${event.country}`
                    : event.country ?? "Unknown"}
                </span>
                <span className="text-[#9CA3AF] w-48 shrink-0 truncate hidden lg:block">
                  {event.isp ?? "—"}
                </span>
                <span className="text-[#9CA3AF] w-16 shrink-0 text-right">
                  {client}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
