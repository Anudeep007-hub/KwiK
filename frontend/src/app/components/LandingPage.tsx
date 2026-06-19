import { useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Check, ExternalLink, BarChart2, ArrowRight } from "lucide-react";
import { getShortUrl } from "../../services/apiConfig";
import { createShortLink } from "../../services/linkService";

export function LandingPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const shortUrl = result ? getShortUrl(result) : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { shortCode } = await createShortLink(url.trim());
      setResult(shortCode);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to create short link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-5xl mx-auto px-6">
      <div className="flex flex-col items-center pt-24 pb-16">
        <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest mb-5">
          Developer URL Platform
        </p>
        <h1 className="text-[42px] font-bold text-[#111827] text-center leading-[1.2] mb-4 tracking-tight">
          Short links.{" "}
          <span className="text-[#6B7280] font-normal">Detailed analytics.</span>
        </h1>
        <p className="text-lg text-[#6B7280] text-center mb-10 max-w-md leading-relaxed">
          Create trackable links and understand where every click comes from.
        </p>

        <form onSubmit={handleCreate} className="w-full max-w-xl flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-long-url.com/path/to/resource"
            className="flex-1 h-11 px-4 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 bg-white text-[#111827] placeholder:text-[#9CA3AF]"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-11 px-5 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100 whitespace-nowrap flex items-center gap-2"
          >
            {loading ? (
              "Creating…"
            ) : (
              <>
                Create Link
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="w-full max-w-xl mt-2 text-sm text-[#DC2626]">{error}</p>
        )}

        {result && (
          <div className="w-full max-w-xl mt-3 border border-[#E5E7EB] rounded">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">
                Short URL created
              </p>
              <div className="flex items-center justify-between gap-4">
                <span
                  className="text-[#2563EB] text-sm font-semibold"
                  style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
                >
                  {shortUrl}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-4 pb-3 pt-2 border-t border-[#F3F4F6] mt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151]"
              >
                {copied ? (
                  <Check size={12} className="text-[#16A34A]" />
                ) : (
                  <Copy size={12} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151] no-underline"
              >
                <ExternalLink size={12} />
                Open
              </a>
              <button
                type="button"
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-colors"
              >
                <BarChart2 size={12} />
                View Analytics
              </button>
            </div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-3 gap-8 w-full max-w-xl border-t border-[#E5E7EB] pt-12">
          {[
            { stat: "8,538", label: "total clicks tracked" },
            { stat: "11", label: "countries reached" },
            { stat: "99.9%", label: "redirect uptime" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p
                className="text-2xl font-bold text-[#111827] mb-1"
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              >
                {item.stat}
              </p>
              <p className="text-xs text-[#9CA3AF]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
