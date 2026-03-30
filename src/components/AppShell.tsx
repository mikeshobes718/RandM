"use client";

import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import AppTopBar from "./AppTopBar";
import BottomTabBar from "./BottomTabBar";

const SIDEBAR_COLLAPSED_KEY = "appSidebarCollapsed";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div
        className={`flex flex-col min-h-screen transition-[margin] duration-200 ease-out ${
          sidebarCollapsed ? "md:ml-[4.5rem]" : "md:ml-64"
        }`}
      >
        <AppTopBar />
        <main className="flex-1 px-3 py-4 md:px-8 md:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
