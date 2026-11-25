"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, getActiveTab } from "@/lib/navigation";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const active = getActiveTab(pathname);

  return (
    <nav
      aria-label="Основная навигация"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3"
      style={{ paddingBottom: "calc(var(--sab) + 10px)" }}
    >
      <div className="pointer-events-auto flex h-[var(--nav-height)] w-full max-w-[460px] items-stretch rounded-[26px] border border-border bg-nav p-1.5 shadow-nav backdrop-blur-xl backdrop-saturate-150">
        {TABS.map((tab) => {
          const isActive = tab.href === active;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (!isActive) haptics.selection();
              }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] transition-colors duration-200",
                isActive ? "text-foreground" : "text-subtle-foreground",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[20px] bg-muted"
                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                />
              ) : null}
              <Icon className="relative size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
              <span className="relative text-[10.5px] font-semibold tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
