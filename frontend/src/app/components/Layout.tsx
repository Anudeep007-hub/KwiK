"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGitHubIssues } from "../../services/linkService";

export function LayoutHeader() {
  const [openIssues, setOpenIssues] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    getGitHubIssues()
      .then((issues) => {
        if (active) {
          setOpenIssues(issues.filter((issue) => issue.status === "OPEN").length);
        }
      })
      .catch(() => {
        if (active) setOpenIssues(0);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="border-b border-[#E5E7EB] sticky top-0 bg-white z-20">
      <div className="max-w-5xl mx-auto px-6 flex items-center h-14">
        <Link
          href="/"
          className="font-bold text-[17px] text-[#111827] mr-8 shrink-0 no-underline select-none"
        >
          <span className="text-[#2563EB]">K</span>wi
          <span className="text-[#2563EB]">K</span>
        </Link>
        <nav className="flex items-center h-14">
          {[
            { href: "/links", label: "Links" },
            { href: "/analytics", label: "Analytics" },
            {
              href: "/issues",
              label: (
                <span className="flex items-center gap-1.5">
                  Issues
                  {openIssues > 0 && (
                    <span className="text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded-full tabular-nums">
                      {openIssues}
                    </span>
                  )}
                </span>
              ),
            },
            { href: "/settings", label: "Settings" },
          ].map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 flex items-center h-14 border-b-2 -mb-px transition-colors duration-100 ${
                  isActive
                    ? "text-[#111827] border-[#2563EB]"
                    : "text-[#6B7280] border-transparent hover:text-[#111827]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
