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
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
