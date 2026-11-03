"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const APP_NAV_KEY = "app-nav";

// Marks this browser tab once the user has moved between pages of the app, so a
// Back button knows router.back() stays inside the app. Renders nothing.
export function NavigationTracker() {
  const pathname = usePathname();
  const firstPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === firstPathname.current) return;
    try {
      window.sessionStorage.setItem(APP_NAV_KEY, "1");
    } catch {
      // Blocked storage: Back falls back to a fixed page instead.
    }
  }, [pathname]);

  return null;
}

/** True when this tab has moved between app pages. Unreadable storage counts as false. */
export function hasInAppHistory(): boolean {
  try {
    return window.sessionStorage.getItem(APP_NAV_KEY) === "1";
  } catch {
    return false;
  }
}
