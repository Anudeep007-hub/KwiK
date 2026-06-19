import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { getGitHubIssues } from "../../services/linkService";

export function Layout() {
  const [openIssues, setOpenIssues] = useState(0);

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E7EB] sticky top-0 bg-white z-20">
        <div className="max-w-5xl mx-auto px-6 flex items-center h-14">
          <Link
            to="/"
            className="font-bold text-[17px] text-[#111827] mr-8 shrink-0 no-underline select-none"
          >
            <span className="text-[#2563EB]">K</span>wi
            <span className="text-[#2563EB]">K</span>
          </Link>
          <nav className="flex items-center h-14">
            {[
              { to: "/links", label: "Links" },
              { to: "/analytics", label: "Analytics" },
              {
                to: "/issues",
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
              { to: "/settings", label: "Settings" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 flex items-center h-14 border-b-2 -mb-px transition-colors duration-100 ${
                    isActive
                      ? "text-[#111827] border-[#2563EB]"
                      : "text-[#6B7280] border-transparent hover:text-[#111827]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
