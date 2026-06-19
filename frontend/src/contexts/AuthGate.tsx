"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { LayoutHeader } from "@/app/components/Layout";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPublicPage = pathname === "/login" || pathname.startsWith("/auth/callback");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="h-5 w-32 bg-[#F3F4F6] rounded mb-6" />
          <div className="h-10 w-full max-w-md bg-[#F9FAFB] border border-[#E5E7EB] rounded" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <LayoutHeader />
      {children}
    </>
  );
}
