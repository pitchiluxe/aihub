"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto md:ml-64 page-enter" style={{ marginLeft: 0 }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <CommandPalette />
    </div>
  );
}
