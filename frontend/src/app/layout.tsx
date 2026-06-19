import type { Metadata } from "next";
import "./styles.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/contexts/AuthGate";

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
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
