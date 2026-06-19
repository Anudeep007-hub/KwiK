"use client";

import { useEffect, useState } from "react";
import {
  CircleDot,
  CheckCircle2,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { Issue, IssueStatus, IssuePriority, IssueType } from "../../types/api";
import { getGitHubIssues } from "../../services/linkService";

const getEffectiveStatus = (issue: Issue): IssueStatus => issue.status;

const StatusIcon = ({ status }: { status: IssueStatus }) => {
  if (status === "OPEN")
    return <CircleDot size={16} className="text-[#16A34A] shrink-0 mt-[1px]" />;
  if (status === "IN_PROGRESS")
    return <CircleDot size={16} className="text-[#D97706] shrink-0 mt-[1px]" />;
  return <CheckCircle2 size={16} className="text-[#9333EA] shrink-0 mt-[1px]" />;
};

const PriorityBadge = ({ priority }: { priority: IssuePriority }) => {
  const styles: Record<IssuePriority, string> = {
    CRITICAL: "bg-[#FEF2F2] text-[#DC2626]",
    HIGH: "bg-[#FFF7ED] text-[#D97706]",
    MEDIUM: "bg-[#FEFCE8] text-[#CA8A04]",
    LOW: "bg-[#F3F4F6] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${styles[priority]}`}
    >
      {priority.toLowerCase()}
    </span>
  );
};

const TypeBadge = ({ type }: { type: IssueType }) => (
  <span
    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
      type === "BUG"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : "bg-[#EFF6FF] text-[#2563EB]"
    }`}
  >
    {type.toLowerCase()}
  </span>
);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

export function IssuesPage() {
  const [filter, setFilter] = useState<IssueStatus>("OPEN");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [issues, setIssues] = useState<(Issue & { effectiveStatus: IssueStatus })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getGitHubIssues()
      .then((data) => {
        if (!active) return;
        setIssues(
          data.map((issue) => ({
            ...issue,
            effectiveStatus: getEffectiveStatus(issue),
          }))
        );
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load GitHub issues");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const counts: Record<IssueStatus, number> = {
    OPEN: issues.filter((i) => i.effectiveStatus === "OPEN").length,
    IN_PROGRESS: issues.filter((i) => i.effectiveStatus === "IN_PROGRESS").length,
    CLOSED: issues.filter((i) => i.effectiveStatus === "CLOSED").length,
  };

  const filtered = issues.filter((i) => i.effectiveStatus === filter);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Issues</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {counts.OPEN} open · {counts.IN_PROGRESS} in progress · {counts.CLOSED} closed
          </p>
        </div>
        <a
          href="https://github.com/issues/assigned"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-9 px-4 bg-[#2563EB] text-white text-sm font-semibold rounded hover:bg-[#1D4ED8] transition-colors duration-100 no-underline"
        >
          <ExternalLink size={14} />
          Open GitHub
        </a>
      </div>

      {loading && <p className="mb-4 text-sm text-[#9CA3AF]">Loading GitHub issues...</p>}
      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      {/* Filter tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E7EB]">
        {(
          [
            { key: "OPEN" as const, label: "Open" },
            { key: "IN_PROGRESS" as const, label: "In Progress" },
            { key: "CLOSED" as const, label: "Closed" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-100 ${
              filter === tab.key
                ? "text-[#111827] border-[#2563EB]"
                : "text-[#6B7280] border-transparent hover:text-[#374151]"
            }`}
          >
            {tab.label}{" "}
            <span className="text-[#9CA3AF] font-normal tabular-nums">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div className="border border-[#E5E7EB] border-t-0 rounded-b overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#9CA3AF]">
            No issues in this state.
          </div>
        ) : (
          filtered.map((issue, i) => {
            const isExpanded = expandedId === issue.id;
            return (
              <div
                key={issue.id}
                className={
                  i < filtered.length - 1 ? "border-b border-[#E5E7EB]" : ""
                }
              >
                <div
                  onClick={() =>
                    setExpandedId(isExpanded ? null : issue.id)
                  }
                  className="flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-[#F9FAFB] transition-colors duration-100"
                >
                  <StatusIcon status={issue.effectiveStatus} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-[#111827]">
                        {issue.title}
                      </span>
                      <TypeBadge type={issue.type} />
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                      <span>
                        #{issue.number} opened {timeAgo(issue.createdAt)} by{" "}
                        {issue.author} · {issue.repository}
                      </span>
                      {issue.linkedPR && (
                        <span className="flex items-center gap-1">
                          <GitPullRequest size={11} />
                          PR #{issue.linkedPR.number} ·{" "}
                          <span
                            className={
                              issue.linkedPR.merged
                                ? "text-[#9333EA]"
                                : "text-[#16A34A]"
                            }
                          >
                            {issue.linkedPR.merged ? "merged" : "open"}
                          </span>{" "}
                          · {issue.linkedPR.repo}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp
                      size={14}
                      className="text-[#9CA3AF] shrink-0 mt-0.5"
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      className="text-[#9CA3AF] shrink-0 mt-0.5"
                    />
                  )}
                </div>

                {isExpanded && (
                  <div className="pl-10 pr-4 pb-5 pt-0 border-t border-[#F3F4F6]">
                    <p className="text-sm text-[#374151] leading-relaxed pt-4 mb-4">
                      {issue.description || "No description provided."}
                    </p>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors text-[#374151] no-underline"
                    >
                      <ExternalLink size={12} />
                      View on GitHub
                    </a>
                    {issue.linkedPR && (
                      <div className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded text-xs">
                        <GitPullRequest
                          size={13}
                          className={
                            issue.linkedPR.merged
                              ? "text-[#9333EA] shrink-0"
                              : "text-[#16A34A] shrink-0"
                          }
                        />
                        <span
                          className="font-semibold text-[#111827]"
                          style={{
                            fontFamily:
                              "var(--font-mono, 'JetBrains Mono', monospace)",
                          }}
                        >
                          #{issue.linkedPR.number}
                        </span>
                        <span className="text-[#6B7280] flex-1 min-w-0 truncate">
                          {issue.linkedPR.title}
                        </span>
                        <span className="text-[#9CA3AF] shrink-0">
                          {issue.linkedPR.repo}
                        </span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                            issue.linkedPR.merged
                              ? "bg-[#F5F3FF] text-[#9333EA]"
                              : "bg-[#DCFCE7] text-[#16A34A]"
                          }`}
                        >
                          {issue.linkedPR.merged ? "Merged" : "Open"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
