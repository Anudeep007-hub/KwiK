import type { Metadata } from "next";
import "./styles.css";
import { LayoutHeader } from "./components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "KwiK",
  description: "URL shortener dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <AuthProvider>
          <LayoutHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
