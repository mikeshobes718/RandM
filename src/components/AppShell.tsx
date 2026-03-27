"use client";

import AppSidebar from "./AppSidebar";
import AppTopBar from "./AppTopBar";
import BottomTabBar from "./BottomTabBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <AppSidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <AppTopBar />
        <main className="flex-1 px-3 py-4 md:px-8 md:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
