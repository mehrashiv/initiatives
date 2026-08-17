"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { AvatarMenu } from "@/components/layout/avatar-menu";
import type { AuthUser } from "@/types";

const NAV_ITEMS = [
  { label: "My Activities", href: "/my-activities" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Initiatives", href: "/initiatives" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
];

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (pathname === "/login" || !user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-[36px]">
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-text-primary md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/my-activities" className="flex items-center">
            <Image
              src="/nile-logo.png"
              alt="Nile"
              width={52}
              height={26}
              style={{ height: "26px", width: "auto" }}
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-pill px-3.5 py-2 text-sm font-med transition-colors duration-(--duration-base) ${
                  isActive(item.href) ? "text-accent" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            type="button"
            aria-disabled="true"
            tabIndex={-1}
            className="relative flex h-10 w-10 cursor-default items-center justify-center rounded-full border border-border bg-surface-subtle text-text-secondary"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-warning" />
          </button>
          <AvatarMenu user={user} />
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-16 z-30 flex flex-col gap-0.5 border-b border-border bg-surface px-4 py-2 shadow-lg md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-sm px-3.5 py-3 text-[15px] font-med ${
                isActive(item.href) ? "bg-accent-lightest text-accent" : "text-text-secondary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
