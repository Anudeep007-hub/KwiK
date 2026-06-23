"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {  logout as logoutService } from "../../services/linkService";
import { Button } from "./ui/button";

export function LayoutHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();




  const handleLogout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <header className="border-b border-[#E5E7EB] sticky top-0 bg-white z-20">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center">
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

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6B7280]">{user.name || user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
